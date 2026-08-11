import { prisma } from "@/lib/db/prisma";
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

export async function getShelterAnimalById(shelterId: string, animalId: string) {
  const animal = await prisma.animal.findFirst({
    where: { id: animalId, shelterId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      minCuratorshipAmount: true,
    },
  });

  if (!animal) return null;

  return {
    ...animal,
    minCuratorshipAmount: animal.minCuratorshipAmount
      ? Number(animal.minCuratorshipAmount)
      : null,
    hasCurator: await shelterAnimalHasActiveCurator(shelterId, animal.id),
  };
}
