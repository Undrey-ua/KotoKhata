import { AnimalStatus, SponsorshipStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { coverMediaUrl } from "@/lib/serialize";

const spotlightInclude = {
  media: {
    where: { type: "PHOTO" as const, isPublic: true },
    orderBy: [{ isCover: "desc" as const }, { createdAt: "desc" as const }],
    take: 1,
  },
};

export type HomepageCatSpotlight = {
  name: string;
  slug: string;
  imageUrl: string | null;
};

function mapSpotlight(animal: {
  name: string;
  slug: string;
  media: Array<{ id: string; publicUrl: string | null; isPublic: boolean }>;
}): HomepageCatSpotlight {
  return {
    name: animal.name,
    slug: animal.slug,
    imageUrl: coverMediaUrl(animal.media),
  };
}

async function getShelterId(shelterSlug: string) {
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { id: true },
  });
  return shelter?.id ?? null;
}

const publicPhotoWhere = {
  isPublic: true,
  media: { some: { type: "PHOTO" as const, isPublic: true } },
} as const;

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

export async function getLatestAdoptedAnimal(
  shelterSlug: string,
): Promise<HomepageCatSpotlight | null> {
  const shelterId = await getShelterId(shelterSlug);
  if (!shelterId) return null;

  const animal = await prisma.animal.findFirst({
    where: {
      shelterId,
      ...publicPhotoWhere,
      status: AnimalStatus.ADOPTED,
    },
    orderBy: [{ adoptedAt: "desc" }, { updatedAt: "desc" }],
    include: spotlightInclude,
  });

  return animal ? mapSpotlight(animal) : null;
}

export async function getLatestNewAnimal(
  shelterSlug: string,
): Promise<HomepageCatSpotlight | null> {
  const shelterId = await getShelterId(shelterSlug);
  if (!shelterId) return null;

  const animal = await prisma.animal.findFirst({
    where: {
      shelterId,
      ...publicPhotoWhere,
      status: { not: AnimalStatus.ADOPTED },
    },
    orderBy: { createdAt: "desc" },
    include: spotlightInclude,
  });

  return animal ? mapSpotlight(animal) : null;
}

/** @deprecated Homepage uses getLatestNewAnimal instead. */
export async function getFeaturedAnimal(shelterSlug: string) {
  const latest = await getLatestNewAnimal(shelterSlug);
  if (!latest) return null;

  return {
    ...latest,
    isManualPick: false,
  };
}
