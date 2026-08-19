import type { Decimal } from "@prisma/client/runtime/library";
import {
  AnimalStatus,
  CuratorRelationshipStatus,
  SponsorshipStatus,
  type AnimalSex,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAnimalsFunding, type AnimalFundingInfo } from "@/lib/animal-funding";
import { coverMediaUrl } from "@/lib/serialize";
import { getPublicShelterFeed, type PublicFeedItem } from "@/lib/shelter-life-stories";
import {
  getLatestAdoptedAnimal,
  getLatestNewAnimal,
  getShelterStats,
  type HomepageCatSpotlight,
} from "@/lib/shelter-stats";

const photoWhere = {
  isPublic: true,
  media: { some: { type: "PHOTO" as const, isPublic: true } },
} as const;

const animalInclude = {
  media: {
    where: { type: "PHOTO" as const, isPublic: true },
    orderBy: [{ isCover: "desc" as const }, { createdAt: "desc" as const }],
    take: 1,
  },
};

export type HomepageCat = {
  id: string;
  name: string;
  slug: string;
  sex: AnimalSex;
  status: AnimalStatus;
  birthDate: Date | null;
  description: string | null;
  coverUrl: string | null;
  funding: AnimalFundingInfo;
};

export type HomepageData = {
  stats: Awaited<ReturnType<typeof getShelterStats>>;
  latestNew: HomepageCatSpotlight | null;
  latestAdopted: HomepageCatSpotlight | null;
  residents: HomepageCat[];
  adoptedGallery: HomepageCat[];
  stories: PublicFeedItem[];
  catsWithCurators: number;
};

async function mapAnimals(
  animals: Array<{
    id: string;
    name: string;
    slug: string;
    sex: AnimalSex;
    status: AnimalStatus;
    birthDate: Date | null;
    description: string | null;
    monthlyGoal: Decimal | null;
    minCuratorshipAmount: Decimal | null;
    media: Array<{ id: string; publicUrl: string | null; isPublic: boolean }>;
  }>,
): Promise<HomepageCat[]> {
  const fundingByAnimal = await getAnimalsFunding(animals);
  return animals.map((animal) => ({
    id: animal.id,
    name: animal.name,
    slug: animal.slug,
    sex: animal.sex,
    status: animal.status,
    birthDate: animal.birthDate,
    description: animal.description,
    coverUrl: coverMediaUrl(animal.media),
    funding: fundingByAnimal.get(animal.id)!,
  }));
}

async function getResidents(shelterId: string): Promise<HomepageCat[]> {
  const [inShelter, adoptedSample] = await Promise.all([
    prisma.animal.findMany({
      where: {
        shelterId,
        ...photoWhere,
        status: { not: AnimalStatus.ADOPTED },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: animalInclude,
    }),
    prisma.animal.findMany({
      where: {
        shelterId,
        ...photoWhere,
        status: AnimalStatus.ADOPTED,
      },
      orderBy: [{ adoptedAt: "desc" }, { updatedAt: "desc" }],
      take: 2,
      include: animalInclude,
    }),
  ]);

  const combined = [...inShelter, ...adoptedSample];
  return mapAnimals(combined);
}

async function getAdoptedGallery(shelterId: string): Promise<HomepageCat[]> {
  const animals = await prisma.animal.findMany({
    where: {
      shelterId,
      ...photoWhere,
      status: AnimalStatus.ADOPTED,
    },
    orderBy: [{ adoptedAt: "desc" }, { updatedAt: "desc" }],
    take: 8,
    include: animalInclude,
  });

  return mapAnimals(animals);
}

async function countCatsWithCurators(shelterId: string) {
  return prisma.animal.count({
    where: {
      shelterId,
      isPublic: true,
      status: { not: AnimalStatus.ADOPTED },
      sponsorships: {
        some: {
          status: SponsorshipStatus.ACTIVE,
          curatorStatus: CuratorRelationshipStatus.ACTIVE,
        },
      },
    },
  });
}

export async function getHomepageData(
  shelterSlug: string,
): Promise<HomepageData | null> {
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { id: true },
  });

  if (!shelter) return null;

  const [
    stats,
    latestNew,
    latestAdopted,
    residents,
    adoptedGallery,
    stories,
    catsWithCurators,
  ] = await Promise.all([
    getShelterStats(shelterSlug),
    getLatestNewAnimal(shelterSlug),
    getLatestAdoptedAnimal(shelterSlug),
    getResidents(shelter.id),
    getAdoptedGallery(shelter.id),
    getPublicShelterFeed(shelterSlug, 4),
    countCatsWithCurators(shelter.id),
  ]);

  return {
    stats,
    latestNew,
    latestAdopted,
    residents,
    adoptedGallery,
    stories,
    catsWithCurators,
  };
}

export type HomepageCatStatusKey =
  | "atHome"
  | "seekingCurator"
  | "hasCuratorSeekingHome";

export function resolveHomepageCatStatusKey(
  status: AnimalStatus,
  funding: AnimalFundingInfo,
): HomepageCatStatusKey {
  if (status === AnimalStatus.ADOPTED) return "atHome";
  if (funding.hasCurators) return "hasCuratorSeekingHome";
  return "seekingCurator";
}
