import { randomBytes } from "crypto";
import {
  ShelterMemberRole,
  TelegramBotType,
  VolunteerAccessRequestStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { createOrUpdateConfirmedAuthUser } from "@/lib/auth/admin-create-user";
import { syncUserFromAuth } from "@/lib/auth/sync-user";
import { DEFAULT_SHELTER_SLUG } from "@/lib/constants";
import { linkTelegramToUser } from "@/lib/telegram/link";

function syntheticVolunteerEmail(chatId: bigint) {
  return `telegram.${chatId}@volunteer.kotoxata.internal`;
}

function randomPassword() {
  return randomBytes(18).toString("base64url");
}

export async function getDefaultVolunteerShelter() {
  return prisma.shelter.findUnique({
    where: { slug: DEFAULT_SHELTER_SLUG },
    select: { id: true, slug: true, name: true },
  });
}

export async function getPendingAccessRequest(chatId: bigint) {
  return prisma.volunteerAccessRequest.findFirst({
    where: {
      telegramChatId: chatId,
      status: VolunteerAccessRequestStatus.PENDING,
    },
    include: { shelter: { select: { name: true } } },
  });
}

export async function createVolunteerAccessRequest({
  shelterId,
  chatId,
  username,
  fullName,
  email,
}: {
  shelterId: string;
  chatId: bigint;
  username?: string;
  fullName: string;
  email?: string | null;
}) {
  const existingMember = await prisma.telegramAccount.findUnique({
    where: {
      chatId_botType: { chatId, botType: TelegramBotType.VOLUNTEER },
    },
    include: {
      user: {
        include: {
          shelterMemberships: { where: { shelterId }, take: 1 },
        },
      },
    },
  });

  if (existingMember?.user.shelterMemberships.length) {
    throw new Error("ALREADY_MEMBER");
  }

  const pending = await getPendingAccessRequest(chatId);
  if (pending) {
    throw new Error("ALREADY_PENDING");
  }

  const normalizedEmail = email?.trim().toLowerCase() || null;

  if (normalizedEmail) {
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        shelterMemberships: { where: { shelterId }, take: 1 },
      },
    });
    if (existingUser?.shelterMemberships.length) {
      throw new Error("EMAIL_ALREADY_MEMBER");
    }
  }

  return prisma.volunteerAccessRequest.create({
    data: {
      shelterId,
      telegramChatId: chatId,
      telegramUsername: username ?? null,
      fullName: fullName.trim(),
      email: normalizedEmail,
    },
    include: { shelter: { select: { name: true, slug: true } } },
  });
}

async function grantVolunteerMembership(shelterId: string, userId: string) {
  await prisma.shelterMember.upsert({
    where: {
      shelterId_userId: { shelterId, userId },
    },
    create: {
      shelterId,
      userId,
      role: ShelterMemberRole.VOLUNTEER,
    },
    update: {},
  });
}

export async function approveVolunteerAccessRequest(
  requestId: string,
  reviewedById: string,
) {
  const request = await prisma.volunteerAccessRequest.findUnique({
    where: { id: requestId },
    include: { shelter: { select: { id: true, name: true, slug: true } } },
  });

  if (!request) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  if (request.status !== VolunteerAccessRequestStatus.PENDING) {
    return { ok: false as const, error: "ALREADY_REVIEWED" as const };
  }

  const email = request.email ?? syntheticVolunteerEmail(request.telegramChatId);
  const password = randomPassword();

  const { user: authUser } = await createOrUpdateConfirmedAuthUser({
    email,
    password,
    fullName: request.fullName,
  });

  await syncUserFromAuth(authUser);

  await prisma.user.update({
    where: { id: authUser.id },
    data: { fullName: request.fullName },
  });

  await grantVolunteerMembership(request.shelterId, authUser.id);

  await linkTelegramToUser({
    chatId: request.telegramChatId,
    username: request.telegramUsername ?? undefined,
    userId: authUser.id,
    botType: TelegramBotType.VOLUNTEER,
  });

  await prisma.volunteerAccessRequest.update({
    where: { id: request.id },
    data: {
      status: VolunteerAccessRequestStatus.APPROVED,
      reviewedById,
      reviewedAt: new Date(),
    },
  });

  return {
    ok: true as const,
    shelterName: request.shelter.name,
    chatId: request.telegramChatId,
  };
}

export async function rejectVolunteerAccessRequest(
  requestId: string,
  reviewedById: string,
) {
  const request = await prisma.volunteerAccessRequest.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return { ok: false as const, error: "NOT_FOUND" as const };
  }

  if (request.status !== VolunteerAccessRequestStatus.PENDING) {
    return { ok: false as const, error: "ALREADY_REVIEWED" as const };
  }

  await prisma.volunteerAccessRequest.update({
    where: { id: request.id },
    data: {
      status: VolunteerAccessRequestStatus.REJECTED,
      reviewedById,
      reviewedAt: new Date(),
    },
  });

  return { ok: true as const, chatId: request.telegramChatId };
}
