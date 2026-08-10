"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requireShelterMember } from "@/lib/auth/session";
import {
  approveVolunteerAccessRequest,
  rejectVolunteerAccessRequest,
} from "@/lib/telegram/volunteer-access";
import {
  notifyVolunteerAccessApproved,
  notifyVolunteerAccessRejected,
} from "@/lib/telegram/notify-admins";

async function requireAdmin(shelterSlug: string) {
  const ctx = await requireShelterMember(shelterSlug);
  if (!ctx.isAdmin) {
    return { error: "Лише адміністратор може керувати запитами" } as const;
  }
  return { ctx } as const;
}

function revalidateVolunteerPaths(shelterSlug: string) {
  revalidatePath(`/crm/${shelterSlug}/volunteers`);
}

export async function approveVolunteerAccessRequestAction(
  shelterSlug: string,
  requestId: string,
) {
  const adminCheck = await requireAdmin(shelterSlug);
  if ("error" in adminCheck) return adminCheck;
  const { ctx } = adminCheck;

  const request = await prisma.volunteerAccessRequest.findFirst({
    where: { id: requestId, shelterId: ctx.shelterId },
  });

  if (!request) {
    return { error: "Запит не знайдено" };
  }

  const result = await approveVolunteerAccessRequest(requestId, ctx.userId);

  if (!result.ok) {
    if (result.error === "ALREADY_REVIEWED") {
      return { error: "Запит уже опрацьовано" };
    }
    return { error: "Запит не знайдено" };
  }

  try {
    await notifyVolunteerAccessApproved(result.chatId, result.shelterName);
  } catch {
    // Telegram notification is best-effort
  }

  revalidateVolunteerPaths(shelterSlug);
  return { success: true };
}

export async function rejectVolunteerAccessRequestAction(
  shelterSlug: string,
  requestId: string,
) {
  const adminCheck = await requireAdmin(shelterSlug);
  if ("error" in adminCheck) return adminCheck;
  const { ctx } = adminCheck;

  const request = await prisma.volunteerAccessRequest.findFirst({
    where: { id: requestId, shelterId: ctx.shelterId },
  });

  if (!request) {
    return { error: "Запит не знайдено" };
  }

  const result = await rejectVolunteerAccessRequest(requestId, ctx.userId);

  if (!result.ok) {
    if (result.error === "ALREADY_REVIEWED") {
      return { error: "Запит уже опрацьовано" };
    }
    return { error: "Запит не знайдено" };
  }

  try {
    await notifyVolunteerAccessRejected(result.chatId);
  } catch {
    // Telegram notification is best-effort
  }

  revalidateVolunteerPaths(shelterSlug);
  return { success: true };
}
