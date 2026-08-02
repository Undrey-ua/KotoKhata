import type { User as SupabaseUser } from "@supabase/supabase-js";
import { ShelterMemberRole } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { acceptVolunteerInvites } from "@/lib/crm/volunteers";

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "admin@kotoxata.org")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const DEFAULT_SHELTER_SLUG = "kotoxata";

export async function syncUserFromAuth(authUser: SupabaseUser) {
  if (!authUser.email) {
    throw new Error("User email is required");
  }

  const email = authUser.email.toLowerCase();

  await prisma.$transaction(async (tx) => {
    const existingByEmail = await tx.user.findUnique({ where: { email } });

    if (existingByEmail && existingByEmail.id !== authUser.id) {
      await tx.shelterMember.updateMany({
        where: { userId: existingByEmail.id },
        data: { userId: authUser.id },
      });
      await tx.user.delete({ where: { id: existingByEmail.id } });
    }

    await tx.user.upsert({
      where: { id: authUser.id },
      create: {
        id: authUser.id,
        email,
        fullName: authUser.user_metadata?.full_name ?? null,
        locale: authUser.user_metadata?.locale ?? "uk",
      },
      update: {
        email,
        fullName: authUser.user_metadata?.full_name ?? undefined,
      },
    });

    const shelter = await tx.shelter.findUnique({
      where: { slug: DEFAULT_SHELTER_SLUG },
    });

    if (shelter && ADMIN_EMAILS.includes(email)) {
      await tx.shelterMember.upsert({
        where: {
          shelterId_userId: { shelterId: shelter.id, userId: authUser.id },
        },
        create: {
          shelterId: shelter.id,
          userId: authUser.id,
          role: ShelterMemberRole.ADMIN,
        },
        update: { role: ShelterMemberRole.ADMIN },
      });
    }
  });

  await acceptVolunteerInvites(authUser.id, email);

  return prisma.user.findUniqueOrThrow({ where: { id: authUser.id } });
}
