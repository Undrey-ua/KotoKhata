"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { requireShelterMember } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import {
  deleteAnimalPhoto,
  setAnimalCoverPhoto,
  uploadAnimalPhoto,
} from "@/lib/storage/media";

function revalidateAnimalMedia(shelterSlug: string, animalSlug?: string) {
  revalidatePath(`/s/${shelterSlug}/cats`);
  revalidatePath(`/crm/${shelterSlug}/animals`);
  if (animalSlug) {
    revalidatePath(`/s/${shelterSlug}/cats/${animalSlug}`);
  }
}

export async function uploadAnimalPhotoAction(
  shelterSlug: string,
  animalId: string,
  formData: FormData,
) {
  const ctx = await requireShelterMember(shelterSlug);

  try {
    const animal = await prisma.animal.findFirst({
      where: { id: animalId, shelterId: ctx.shelterId },
    });

    if (!animal) {
      return { error: "Animal not found" };
    }

    const file = formData.get("photo") as File | null;
    if (!file?.size) {
      return { error: "Оберіть файл" };
    }

    const setAsCover = formData.has("setAsCover");

    await uploadAnimalPhoto({
      shelterId: ctx.shelterId,
      animalId,
      file,
      isCover: setAsCover,
      isPublic: animal.isPublic,
    });

    revalidateAnimalMedia(shelterSlug, animal.slug);
    return { success: true };
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return {
      error: e instanceof Error ? e.message : "Upload failed",
    };
  }
}

export async function setCoverPhotoAction(
  shelterSlug: string,
  animalId: string,
  mediaId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, shelterId: ctx.shelterId },
  });

  if (!animal) {
    return { error: "Animal not found" };
  }

  await setAnimalCoverPhoto(mediaId, animalId);
  revalidateAnimalMedia(shelterSlug, animal.slug);
  return { success: true };
}

export async function deletePhotoAction(
  shelterSlug: string,
  animalId: string,
  mediaId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, shelterId: ctx.shelterId },
  });

  if (!animal) {
    return { error: "Animal not found" };
  }

  await deleteAnimalPhoto(mediaId, animalId);
  revalidateAnimalMedia(shelterSlug, animal.slug);
  return { success: true };
}
