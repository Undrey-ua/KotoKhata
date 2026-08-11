import {
  AnimalStatus,
  CuratorRelationshipStatus,
  SponsorshipStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_ANIMAL_LOCATION } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import { uploadAnimalPhotoBuffer } from "@/lib/storage/media";

async function uniqueAnimalSlug(shelterId: string, name: string) {
  const base = slugify(name) || "kit";
  let candidate = base;
  let suffix = 2;

  while (
    await prisma.animal.findFirst({
      where: { shelterId, slug: candidate },
      select: { id: true },
    })
  ) {
    candidate = `${base}-${suffix++}`;
  }

  return candidate;
}

export async function findLivingShelterAnimalByName(
  shelterId: string,
  name: string,
) {
  const trimmed = name.trim();
  if (!trimmed) return null;

  return prisma.animal.findFirst({
    where: {
      shelterId,
      status: { not: AnimalStatus.ADOPTED },
      name: { equals: trimmed, mode: "insensitive" },
    },
    select: { id: true, name: true },
  });
}

export async function createAnimalFromTelegram({
  shelterId,
  name,
  photoBuffer,
  photoMimeType,
}: {
  shelterId: string;
  name: string;
  photoBuffer: Buffer;
  photoMimeType: string;
}) {
  const slug = await uniqueAnimalSlug(shelterId, name);

  const animal = await prisma.animal.create({
    data: {
      shelterId,
      name: name.trim(),
      slug,
      status: AnimalStatus.SEEKING_SPONSOR,
      location: DEFAULT_ANIMAL_LOCATION,
      isPublic: true,
    },
  });

  await uploadAnimalPhotoBuffer({
    shelterId,
    animalId: animal.id,
    buffer: photoBuffer,
    mimeType: photoMimeType,
    isCover: true,
    isPublic: true,
  });

  return animal;
}

export async function listShelterAnimals(shelterId: string, limit = 10) {
  return prisma.animal.findMany({
    where: { shelterId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, slug: true, status: true },
  });
}

const activeCuratorshipFilter = {
  status: SponsorshipStatus.ACTIVE,
  curatorStatus: CuratorRelationshipStatus.ACTIVE,
} as const;

/** Cats with at least one active curator — for volunteer news to curators. */
export async function listShelterAnimalsWithCurators(
  shelterId: string,
  limit = 30,
) {
  return prisma.animal.findMany({
    where: {
      shelterId,
      status: { not: AnimalStatus.ADOPTED },
      sponsorships: { some: activeCuratorshipFilter },
    },
    orderBy: { name: "asc" },
    take: limit,
    select: { id: true, name: true },
  });
}

export async function shelterAnimalHasActiveCurator(
  shelterId: string,
  animalId: string,
) {
  const animal = await prisma.animal.findFirst({
    where: {
      id: animalId,
      shelterId,
      sponsorships: { some: activeCuratorshipFilter },
    },
    select: { id: true },
  });
  return animal != null;
}
