"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ShelterMemberRole } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireShelterMember } from "@/lib/auth/session";
import { createOrUpdateConfirmedAuthUser } from "@/lib/auth/admin-create-user";
import { syncUserFromAuth } from "@/lib/auth/sync-user";
import { parseUpdateVolunteerForm } from "@/lib/validations/volunteer";

const addVolunteerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Невірний формат email"),
  password: z.string().min(6, "Пароль — мінімум 6 символів"),
  fullName: z
    .string()
    .trim()
    .transform((v) => (v.length ? v : undefined))
    .optional(),
});

function revalidateVolunteerPaths(shelterSlug: string, userId?: string) {
  revalidatePath(`/crm/${shelterSlug}`);
  revalidatePath(`/crm/${shelterSlug}/volunteers`);
  if (userId) {
    revalidatePath(`/crm/${shelterSlug}/volunteers/${userId}`);
  }
}

async function requireAdmin(shelterSlug: string) {
  const ctx = await requireShelterMember(shelterSlug);
  if (!ctx.isAdmin) {
    return { error: "Лише адміністратор може керувати волонтерами" } as const;
  }
  return { ctx } as const;
}

async function grantVolunteerAccess(
  shelterId: string,
  userId: string,
  email: string,
) {
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

  await prisma.volunteerInvite.updateMany({
    where: { shelterId, email, acceptedAt: null },
    data: { acceptedAt: new Date() },
  });
}

export async function inviteVolunteerAction(
  shelterSlug: string,
  _prevState: { error?: string; success?: boolean; message?: string } | null,
  formData: FormData,
) {
  const adminCheck = await requireAdmin(shelterSlug);
  if ("error" in adminCheck) return adminCheck;
  const { ctx } = adminCheck;

  const parsed = addVolunteerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Перевірте дані форми" };
  }

  const { email, password, fullName } = parsed.data;

  try {
    const existingMember = await prisma.shelterMember.findFirst({
      where: {
        shelterId: ctx.shelterId,
        user: { email },
      },
    });

    if (existingMember) {
      return { error: "Цей користувач вже має доступ до притулку" };
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    const { user: authUser, created } = await createOrUpdateConfirmedAuthUser({
      email,
      password,
      fullName: fullName ?? existingUser?.fullName ?? undefined,
    });

    await syncUserFromAuth(authUser);

    if (fullName) {
      await prisma.user.update({
        where: { id: authUser.id },
        data: { fullName },
      });
    }

    await grantVolunteerAccess(ctx.shelterId, authUser.id, email);

    revalidateVolunteerPaths(shelterSlug);
    return {
      success: true,
      message: created
        ? `${email} — обліковий запис створено. Вхід: /uk/staff/login`
        : `${email} — доступ надано. Вхід: /uk/staff/login`,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Не вдалося додати волонтера";
    if (message.includes("Supabase admin credentials")) {
      return {
        error:
          "Не налаштовано SUPABASE_SERVICE_ROLE_KEY — зверніться до розробника",
      };
    }
    return { error: message };
  }
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

export async function revokeVolunteerAccessFromProfileAction(
  shelterSlug: string,
  memberId: string,
) {
  const result = await revokeVolunteerAccessAction(shelterSlug, memberId);
  if ("error" in result && result.error) {
    return { error: result.error };
  }
  redirect(`/crm/${shelterSlug}/volunteers`);
}

export async function updateVolunteerMemberAction(
  shelterSlug: string,
  userId: string,
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const adminCheck = await requireAdmin(shelterSlug);
  if ("error" in adminCheck) return adminCheck;
  const { ctx } = adminCheck;

  let data;
  try {
    data = parseUpdateVolunteerForm(formData);
  } catch {
    return { error: "Перевірте дані форми" };
  }

  const member = await prisma.shelterMember.findFirst({
    where: { shelterId: ctx.shelterId, userId },
  });

  if (!member) {
    return { error: "Волонтера не знайдено" };
  }

  if (
    member.role === ShelterMemberRole.ADMIN &&
    data.role !== ShelterMemberRole.ADMIN
  ) {
    const adminCount = await prisma.shelterMember.count({
      where: { shelterId: ctx.shelterId, role: ShelterMemberRole.ADMIN },
    });
    if (adminCount <= 1) {
      return { error: "Не можна змінити роль останнього адміністратора" };
    }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
      },
    }),
    prisma.shelterMember.update({
      where: { id: member.id },
      data: {
        role: data.role,
        bio: data.bio,
        showOnContacts: data.showOnContacts,
      },
    }),
  ]);

  revalidateVolunteerPaths(shelterSlug, userId);
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
