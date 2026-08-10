import { randomBytes } from "crypto";
import { TelegramBotType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

const CODE_TTL_MINUTES = 15;

function generateCode() {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function createTelegramLinkCode(
  userId: string,
  botType: TelegramBotType,
) {
  const code = generateCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000);

  await prisma.telegramLinkCode.create({
    data: { userId, code, botType, expiresAt },
  });

  return { code, expiresAt };
}

export async function redeemTelegramLinkCode({
  code,
  chatId,
  username,
  botType,
}: {
  code: string;
  chatId: bigint;
  username?: string;
  botType: TelegramBotType;
}) {
  const normalized = code.trim().toUpperCase();
  const linkCode = await prisma.telegramLinkCode.findUnique({
    where: { code: normalized },
  });

  if (!linkCode || linkCode.botType !== botType) {
    return { ok: false as const, error: "invalid" as const };
  }

  if (linkCode.usedAt) {
    return { ok: false as const, error: "used" as const };
  }

  if (linkCode.expiresAt < new Date()) {
    return { ok: false as const, error: "expired" as const };
  }

  const membership = await prisma.shelterMember.findFirst({
    where: { userId: linkCode.userId },
    include: { shelter: true },
    orderBy: { joinedAt: "asc" },
  });

  if (botType === TelegramBotType.VOLUNTEER && !membership) {
    return { ok: false as const, error: "not_member" as const };
  }

  await prisma.$transaction([
    prisma.telegramLinkCode.update({
      where: { id: linkCode.id },
      data: { usedAt: new Date() },
    }),
    linkTelegramToUser({
      chatId,
      username,
      userId: linkCode.userId,
      botType,
    }),
  ]);

  return {
    ok: true as const,
    userId: linkCode.userId,
    shelter: membership?.shelter ?? null,
  };
}

export function linkTelegramToUser({
  chatId,
  username,
  userId,
  botType,
}: {
  chatId: bigint;
  username?: string;
  userId: string;
  botType: TelegramBotType;
}) {
  return prisma.telegramAccount.upsert({
    where: {
      chatId_botType: { chatId, botType },
    },
    create: {
      userId,
      chatId,
      username: username ?? null,
      botType,
    },
    update: {
      userId,
      username: username ?? null,
    },
  });
}

export async function getLinkedVolunteer(chatId: bigint) {
  const account = await prisma.telegramAccount.findUnique({
    where: {
      chatId_botType: { chatId, botType: TelegramBotType.VOLUNTEER },
    },
    include: {
      user: {
        include: {
          shelterMemberships: {
            include: { shelter: true },
            orderBy: { joinedAt: "asc" },
          },
        },
      },
    },
  });

  if (!account) return null;

  const membership = account.user.shelterMemberships[0] ?? null;

  return {
    account,
    user: account.user,
    membership,
    shelter: membership?.shelter ?? null,
  };
}
