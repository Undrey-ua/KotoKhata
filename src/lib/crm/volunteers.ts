import { ShelterMemberRole } from "@prisma/client";
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
