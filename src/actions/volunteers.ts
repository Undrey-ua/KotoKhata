"use server";

import { revalidatePath } from "next/cache";
import { ShelterMemberRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireShelterMember } from "@/lib/auth/session";

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Невірний формат email");

function revalidateVolunteerPaths(shelterSlug: string) {
  revalidatePath(`/crm/${shelterSlug}`);
  revalidatePath(`/crm/${shelterSlug}/volunteers`);
}

async function requireAdmin(shelterSlug: string) {
  const ctx = await requireShelterMember(shelterSlug);
  if (!ctx.isAdmin) {
    return { error: "Лише адміністратор може керувати волонтерами" } as const;
  }
  return { ctx } as const;
}

export async function inviteVolunteerAction(
  shelterSlug: string,
  _prevState: { error?: string; success?: boolean; message?: string } | null,
  formData: FormData,
) {
  const adminCheck = await requireAdmin(shelterSlug);
  if ("error" in adminCheck) return adminCheck;
  const { ctx } = adminCheck;

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Невірний email" };
  }

  const email = parsed.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    const existingMember = await prisma.shelterMember.findUnique({
      where: {
        shelterId_userId: {
          shelterId: ctx.shelterId,
          userId: existingUser.id,
        },
      },
    });

    if (existingMember) {
      return { error: "Цей користувач вже має доступ до притулку" };
    }

    await prisma.shelterMember.create({
      data: {
        shelterId: ctx.shelterId,
        userId: existingUser.id,
        role: ShelterMemberRole.VOLUNTEER,
      },
    });

    await prisma.volunteerInvite.updateMany({
      where: { shelterId: ctx.shelterId, email, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });

    revalidateVolunteerPaths(shelterSlug);
    return {
      success: true,
      message: `${email} — доступ надано. Може увійти на /uk/staff/login`,
    };
  }

  await prisma.volunteerInvite.upsert({
    where: {
      shelterId_email: { shelterId: ctx.shelterId, email },
    },
    create: {
      shelterId: ctx.shelterId,
      email,
      role: ShelterMemberRole.VOLUNTEER,
      invitedById: ctx.userId,
    },
    update: {
      invitedById: ctx.userId,
      acceptedAt: null,
    },
  });

  revalidateVolunteerPaths(shelterSlug);
  return {
    success: true,
    message: `Запрошення для ${email}. Доступ з'явиться після реєстрації на сайті.`,
  };
}

export async function revokeVolunteerAccessAction(
  shelterSlug: string,
  memberId: string,
) {
  const adminCheck = await requireAdmin(shelterSlug);
  if ("error" in adminCheck) return adminCheck;
  const { ctx } = adminCheck;

  const member = await prisma.shelterMember.findFirst({
    where: { id: memberId, shelterId: ctx.shelterId },
  });

  if (!member) {
    return { error: "Учасника не знайдено" };
  }

  if (member.userId === ctx.userId) {
    return { error: "Не можна забрати доступ у самого себе" };
  }

  if (member.role === ShelterMemberRole.ADMIN) {
    const adminCount = await prisma.shelterMember.count({
      where: { shelterId: ctx.shelterId, role: ShelterMemberRole.ADMIN },
    });
    if (adminCount <= 1) {
      return { error: "Не можна видалити останнього адміністратора" };
    }
  }

  await prisma.shelterMember.delete({ where: { id: member.id } });
  revalidateVolunteerPaths(shelterSlug);
  return { success: true };
}

export async function cancelVolunteerInviteAction(
  shelterSlug: string,
  inviteId: string,
) {
  const adminCheck = await requireAdmin(shelterSlug);
  if ("error" in adminCheck) return adminCheck;
  const { ctx } = adminCheck;

  const invite = await prisma.volunteerInvite.findFirst({
    where: { id: inviteId, shelterId: ctx.shelterId, acceptedAt: null },
  });

  if (!invite) {
    return { error: "Запрошення не знайдено" };
  }

  await prisma.volunteerInvite.delete({ where: { id: invite.id } });
  revalidateVolunteerPaths(shelterSlug);
  return { success: true };
}
