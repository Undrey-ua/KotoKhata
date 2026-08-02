import { AnimalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { DEFAULT_ANIMAL_LOCATION } from "@/lib/constants";
import { slugify } from "@/lib/slug";
import { uploadAnimalPhotoBuffer } from "@/lib/storage/media";

async function uniqueAnimalSlug(shelterId: string, name: string) {
  const base = slugify(name) || "kotyk";
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
