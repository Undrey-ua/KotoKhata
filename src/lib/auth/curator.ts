import { SponsorshipStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { getAppSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export async function getActiveSponsorships(userId: string) {
  return prisma.sponsorship.findMany({
    where: { sponsorId: userId, status: SponsorshipStatus.ACTIVE },
    include: {
      animal: {
        include: {
          shelter: { select: { slug: true, name: true } },
          media: {
            where: { type: "PHOTO", isCover: true },
            take: 1,
            select: { id: true, publicUrl: true, isPublic: true, isCover: true },
          },
        },
      },
    },
    orderBy: { startedAt: "desc" },
  });
}

export function resolveCuratorHomeHref(
  sponsorships: { animal: { slug: string } }[],
): string | null {
  if (sponsorships.length === 0) return null;
  if (sponsorships.length === 1) return `/my/${sponsorships[0].animal.slug}`;
  return "/my";
}

export async function getCuratorHomeHref(userId: string) {
  const sponsorships = await getActiveSponsorships(userId);
  return resolveCuratorHomeHref(sponsorships);
}

export async function requireCuratorSession() {
  const session = await getAppSession();
  if (!session) {
    redirect("/uk/login");
  }
  return session;
}

export async function requireCuratorAnimal(slug: string) {
  const session = await requireCuratorSession();

  const sponsorship = await prisma.sponsorship.findFirst({
    where: {
      sponsorId: session.appUser.id,
      status: SponsorshipStatus.ACTIVE,
      animal: { slug },
    },
    include: {
      animal: {
        include: {
          shelter: true,
          media: {
            where: { type: "PHOTO" },
            orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
          },
          lifeStories: {
            orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
            include: {
              author: { select: { fullName: true } },
              media: {
                where: { type: "PHOTO" },
                orderBy: { createdAt: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!sponsorship) {
    redirect("/my");
  }

  return { session, sponsorship, animal: sponsorship.animal };
}

export async function userCanAccessAnimalMedia(
  userId: string,
  animalId: string,
  shelterId: string,
) {
  const [membership, sponsorship] = await Promise.all([
    prisma.shelterMember.findFirst({
      where: { userId, shelterId },
    }),
    prisma.sponsorship.findFirst({
      where: {
        sponsorId: userId,
        animalId,
        status: SponsorshipStatus.ACTIVE,
      },
    }),
  ]);

  return Boolean(membership || sponsorship);
}
