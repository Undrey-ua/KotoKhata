import { redirect } from "next/navigation";
import { SponsorshipStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type LoginIntent = "curator" | "staff";

export async function redirectAfterLogin(userId: string, intent: LoginIntent) {
  const appUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      shelterMemberships: { include: { shelter: true } },
      sponsorships: {
        where: { status: SponsorshipStatus.ACTIVE },
        include: { animal: { select: { slug: true } } },
      },
    },
  });

  if (intent === "staff") {
    const membership = appUser?.shelterMemberships[0];
    if (!membership) {
      redirect("/uk/staff/login?error=no_access");
    }
    redirect(`/uk/crm/${membership.shelter.slug}/animals`);
  }

  // Кураторський вхід — завжди кабінет опікуна, навіть якщо є доступ до CRM
  if (appUser?.sponsorships.length === 1) {
    redirect(`/uk/my/${appUser.sponsorships[0].animal.slug}`);
  }

  redirect("/uk/my");
}

export async function getUserLoginCapabilities(userId: string) {
  const appUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      shelterMemberships: { take: 1 },
      sponsorships: {
        where: { status: SponsorshipStatus.ACTIVE },
        take: 1,
      },
    },
  });

  return {
    isStaff: (appUser?.shelterMemberships.length ?? 0) > 0,
    isCurator: (appUser?.sponsorships.length ?? 0) > 0,
  };
}
