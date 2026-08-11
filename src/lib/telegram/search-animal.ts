import type { AnimalSex, AnimalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl, isPublicHttpsUrl } from "@/lib/env";
import { slugify } from "@/lib/slug";
import { shelterAnimalHasActiveCurator } from "@/lib/telegram/create-animal";

export type ShelterAnimalSearchHit = {
  id: string;
  name: string;
  slug: string;
  status: string;
  minCuratorshipAmount: number | null;
  hasCurator: boolean;
};

export type ShelterAnimalTelegramProfile = {
  id: string;
  name: string;
  slug: string;
  sex: AnimalSex;
  status: AnimalStatus;
  description: string | null;
  minCuratorshipAmount: number | null;
  hasCurator: boolean;
  coverPhotoUrl: string | null;
};

export function buildTelegramMediaUrl(mediaId: string) {
  const url = `${getAppUrl()}/api/media/${mediaId}`;
  return isPublicHttpsUrl(url) ? url : null;
}

export async function searchShelterAnimalsByQuery(
  shelterId: string,
  query: string,
  limit = 8,
): Promise<ShelterAnimalSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const slugPart = slugify(trimmed);

  const animals = await prisma.animal.findMany({
    where: {
      shelterId,
      OR: [
        { name: { contains: trimmed, mode: "insensitive" } },
        ...(slugPart
          ? [{ slug: { contains: slugPart, mode: "insensitive" as const } }]
          : []),
      ],
    },
    orderBy: { name: "asc" },
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      minCuratorshipAmount: true,
    },
  });

  const hits = await Promise.all(
    animals.map(async (animal) => ({
      ...animal,
      minCuratorshipAmount: animal.minCuratorshipAmount
        ? Number(animal.minCuratorshipAmount)
        : null,
      hasCurator: await shelterAnimalHasActiveCurator(shelterId, animal.id),
    })),
  );

  return hits;
}

export async function getShelterAnimalProfileForTelegram(
  shelterId: string,
  animalId: string,
): Promise<ShelterAnimalTelegramProfile | null> {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, shelterId },
    select: {
      id: true,
      name: true,
      slug: true,
      sex: true,
      status: true,
      description: true,
      minCuratorshipAmount: true,
      media: {
        where: { type: "PHOTO", isPublic: true },
        orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { id: true, isCover: true },
      },
    },
  });

  if (!animal) return null;

  const coverPhotoUrl = animal.media[0]
    ? buildTelegramMediaUrl(animal.media[0].id)
    : null;

  return {
    id: animal.id,
    name: animal.name,
    slug: animal.slug,
    sex: animal.sex,
    status: animal.status,
    description: animal.description,
    minCuratorshipAmount: animal.minCuratorshipAmount
      ? Number(animal.minCuratorshipAmount)
      : null,
    hasCurator: await shelterAnimalHasActiveCurator(shelterId, animal.id),
    coverPhotoUrl,
  };
}

/** @deprecated Use getShelterAnimalProfileForTelegram */
export async function getShelterAnimalById(shelterId: string, animalId: string) {
  const profile = await getShelterAnimalProfileForTelegram(shelterId, animalId);
  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    slug: profile.slug,
    status: profile.status,
    minCuratorshipAmount: profile.minCuratorshipAmount,
    hasCurator: profile.hasCurator,
  };
}
