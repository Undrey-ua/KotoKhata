import { ShelterMemberRole, TelegramBotType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type VolunteerListItem =
  | {
      kind: "member";
      id: string;
      userId: string;
      email: string;
      fullName: string | null;
      role: ShelterMemberRole;
      joinedAt: Date;
    }
  | {
      kind: "invite";
      id: string;
      email: string;
      role: ShelterMemberRole;
      createdAt: Date;
    };

export type VolunteerDetail = {
  memberId: string;
  userId: string;
  email: string;
  fullName: string | null;
  phone: string | null;
  avatarUrl: string | null;
  locale: string;
  role: ShelterMemberRole;
  bio: string | null;
  showOnContacts: boolean;
  joinedAt: Date;
  telegram: {
    linked: boolean;
    username: string | null;
    linkedAt: Date | null;
  };
  activity: {
    lifeStories: number;
    medicalRecords: number;
    statusChanges: number;
  };
};

export async function getVolunteerDetail(
  shelterId: string,
  userId: string,
): Promise<VolunteerDetail | null> {
  const member = await prisma.shelterMember.findFirst({
    where: { shelterId, userId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          avatarUrl: true,
          locale: true,
          telegramAccounts: {
            where: { botType: TelegramBotType.VOLUNTEER },
            select: { username: true, linkedAt: true },
            take: 1,
          },
        },
      },
    },
  });

  if (!member) return null;

  const [lifeStories, medicalRecords, statusChanges] = await Promise.all([
    prisma.lifeStory.count({
      where: { authorId: userId, animal: { shelterId } },
    }),
    prisma.medicalRecord.count({
      where: { authorId: userId, animal: { shelterId } },
    }),
    prisma.animalStatusHistory.count({
      where: { changedById: userId, animal: { shelterId } },
    }),
  ]);

  const telegramAccount = member.user.telegramAccounts[0];

  return {
    memberId: member.id,
    userId: member.user.id,
    email: member.user.email,
    fullName: member.user.fullName,
    phone: member.user.phone,
    avatarUrl: member.user.avatarUrl,
    locale: member.user.locale,
    role: member.role,
    bio: member.bio,
    showOnContacts: member.showOnContacts,
    joinedAt: member.joinedAt,
    telegram: {
      linked: Boolean(telegramAccount),
      username: telegramAccount?.username ?? null,
      linkedAt: telegramAccount?.linkedAt ?? null,
    },
    activity: {
      lifeStories,
      medicalRecords,
      statusChanges,
    },
  };
}

export async function getPublicContactVolunteers(shelterId: string) {
  const members = await prisma.shelterMember.findMany({
    where: {
      shelterId,
      showOnContacts: true,
      role: { not: ShelterMemberRole.ADMIN },
    },
    include: {
      user: {
        select: {
          fullName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  return members.map((member) => ({
    memberId: member.id,
    fullName: member.user.fullName,
    email: member.user.email,
    phone: member.user.phone,
    avatarUrl: member.user.avatarUrl,
    role: member.role,
    bio: member.bio,
  }));
}

export async function getShelterVolunteers(shelterId: string) {
  const [members, invites] = await Promise.all([
    prisma.shelterMember.findMany({
      where: { shelterId },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.volunteerInvite.findMany({
      where: { shelterId, acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const memberEmails = new Set(members.map((m) => m.user.email.toLowerCase()));

  const items: VolunteerListItem[] = [
    ...members.map((m) => ({
      kind: "member" as const,
      id: m.id,
      userId: m.user.id,
      email: m.user.email,
      fullName: m.user.fullName,
      role: m.role,
      joinedAt: m.joinedAt,
    })),
    ...invites
      .filter((i) => !memberEmails.has(i.email.toLowerCase()))
      .map((i) => ({
        kind: "invite" as const,
        id: i.id,
        email: i.email,
        role: i.role,
        createdAt: i.createdAt,
      })),
  ];

  return items;
}

export async function acceptVolunteerInvites(userId: string, email: string) {
  const normalized = email.toLowerCase();
  const invites = await prisma.volunteerInvite.findMany({
    where: { email: normalized, acceptedAt: null },
  });

  if (!invites.length) return;

  await prisma.$transaction([
    ...invites.map((invite) =>
      prisma.shelterMember.upsert({
        where: {
          shelterId_userId: { shelterId: invite.shelterId, userId },
        },
        create: {
          shelterId: invite.shelterId,
          userId,
          role: invite.role,
        },
        update: {},
      }),
    ),
    prisma.volunteerInvite.updateMany({
      where: { email: normalized, acceptedAt: null },
      data: { acceptedAt: new Date() },
    }),
  ]);
}
