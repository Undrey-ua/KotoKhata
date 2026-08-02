"use server";

import { TelegramBotType } from "@prisma/client";
import { requireShelterMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { createTelegramLinkCode } from "@/lib/telegram/link";

export async function getVolunteerTelegramStatusAction(shelterSlug: string) {
  const ctx = await requireShelterMember(shelterSlug);

  const account = await prisma.telegramAccount.findFirst({
    where: {
      userId: ctx.userId,
      botType: TelegramBotType.VOLUNTEER,
    },
    select: { linkedAt: true, username: true },
  });

  return {
    linked: Boolean(account),
    linkedAt: account?.linkedAt.toISOString() ?? null,
    username: account?.username ?? null,
  };
}

export async function generateVolunteerLinkCodeAction(shelterSlug: string) {
  const ctx = await requireShelterMember(shelterSlug);

  const { code, expiresAt } = await createTelegramLinkCode(
    ctx.userId,
    TelegramBotType.VOLUNTEER,
  );

  return {
    code,
    expiresAt: expiresAt.toISOString(),
    command: `/link ${code}`,
  };
}
