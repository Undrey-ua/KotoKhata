import { AnimalStatus, SponsorshipStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { coverMediaUrl } from "@/lib/serialize";

const featuredInclude = {
  media: {
    where: { type: "PHOTO" as const, isPublic: true },
    orderBy: [{ isCover: "desc" as const }, { createdAt: "desc" as const }],
    take: 1,
  },
};

export async function getShelterStats(shelterSlug: string) {
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
  });

  if (!shelter) return null;

  const base = { shelterId: shelter.id, isPublic: true };

  const [inCare, adopted, seekingHome, guardians, news] = await Promise.all([
    prisma.animal.count({ where: base }),
    prisma.animal.count({
      where: { ...base, status: AnimalStatus.ADOPTED },
    }),
    prisma.animal.count({
      where: { ...base, status: { not: AnimalStatus.ADOPTED } },
    }),
    prisma.sponsorship.count({
      where: {
        status: SponsorshipStatus.ACTIVE,
        animal: { shelterId: shelter.id },
      },
    }),
    prisma.lifeStory.count({
      where: { isPublic: true, shelterId: shelter.id },
    }),
  ]);

  return { inCare, adopted, seekingHome, guardians, news, shelter };
}

export async function getFeaturedAnimal(shelterSlug: string) {
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
  });

  if (!shelter) return null;

  const baseWhere = {
    shelterId: shelter.id,
    isPublic: true,
    media: { some: { type: "PHOTO" as const, isPublic: true } },
  };

  const featured = await prisma.animal.findFirst({
    where: { ...baseWhere, isFeatured: true },
    include: featuredInclude,
  });

  const animal =
    featured ??
    (await prisma.animal.findFirst({
      where: baseWhere,
      orderBy: { updatedAt: "desc" },
      include: featuredInclude,
    }));

  if (!animal) return null;

  return {
    name: animal.name,
    slug: animal.slug,
    imageUrl: coverMediaUrl(animal.media),
    isManualPick: animal.isFeatured,
  };
}
