"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/db/prisma";
import { requireShelterMember } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";
import { parseAnimalForm } from "@/lib/validations/animal";
import { uploadAnimalPhoto, deleteAllAnimalMedia } from "@/lib/storage/media";
import { SponsorshipStatus, AnimalStatus } from "@prisma/client";

function revalidateAnimalPaths(shelterSlug: string, animalSlug?: string) {
  revalidatePath(`/s/${shelterSlug}/cats`);
  revalidatePath(`/crm/${shelterSlug}/animals`);
  revalidatePath("/uk");
  revalidatePath("/en");
  if (animalSlug) {
    revalidatePath(`/s/${shelterSlug}/cats/${animalSlug}`);
  }
}

async function applyFeaturedFlag(
  shelterId: string,
  animalId: string,
  isFeatured: boolean,
) {
  if (!isFeatured) return;

  await prisma.animal.updateMany({
    where: { shelterId, id: { not: animalId } },
    data: { isFeatured: false },
  });
}

async function handlePhotoUpload(
  formData: FormData,
  shelterId: string,
  animalId: string,
  isPublic: boolean,
) {
  const photo = formData.get("photo") as File | null;
  if (photo?.size) {
    await uploadAnimalPhoto({
      shelterId,
      animalId,
      file: photo,
      isCover: true,
      isPublic,
    });
  }
}

export async function createAnimalAction(
  shelterSlug: string,
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const ctx = await requireShelterMember(shelterSlug);

  try {
    const data = parseAnimalForm(formData);
    const slug = data.slug || slugify(data.name);

    const animal = await prisma.animal.create({
      data: {
        name: data.name,
        slug,
        sex: data.sex,
        status: data.status,
        personality: data.personality,
        description: data.description,
        characterTraits: data.characterTraits,
        location: data.location,
        vaccinated: data.vaccinated,
        sterilized: data.sterilized,
        isPublic: data.isPublic,
        isFeatured: data.isFeatured,
        birthDate: data.birthDate,
        shelterId: ctx.shelterId,
        monthlyGoal: data.monthlyGoal ?? null,
        minCuratorshipAmount: data.minCuratorshipAmount ?? null,
        adoptedAt:
          data.status === AnimalStatus.ADOPTED ? new Date() : null,
      },
    });

    await applyFeaturedFlag(ctx.shelterId, animal.id, data.isFeatured);

    await handlePhotoUpload(formData, ctx.shelterId, animal.id, data.isPublic);

    revalidateAnimalPaths(shelterSlug, slug);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return {
      error: e instanceof Error ? e.message : "Failed to create animal",
    };
  }

  redirect(`/uk/crm/${shelterSlug}/animals`);
}

export async function updateAnimalAction(
  shelterSlug: string,
  animalId: string,
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const ctx = await requireShelterMember(shelterSlug);

  try {
    const data = parseAnimalForm(formData);

    const existing = await prisma.animal.findFirst({
      where: { id: animalId, shelterId: ctx.shelterId },
    });

    if (!existing) {
      return { error: "Animal not found" };
    }

    let adoptedAt = existing.adoptedAt;
    if (
      data.status === AnimalStatus.ADOPTED &&
      existing.status !== AnimalStatus.ADOPTED
    ) {
      adoptedAt = new Date();
    } else if (data.status !== AnimalStatus.ADOPTED) {
      adoptedAt = null;
    }

    await prisma.animal.update({
      where: { id: animalId },
      data: {
        name: data.name,
        slug: data.slug,
        sex: data.sex,
        status: data.status,
        personality: data.personality,
        description: data.description,
        characterTraits: data.characterTraits,
        location: data.location,
        vaccinated: data.vaccinated,
        sterilized: data.sterilized,
        isPublic: data.isPublic,
        isFeatured: data.isFeatured,
        birthDate: data.birthDate,
        monthlyGoal: data.monthlyGoal ?? null,
        minCuratorshipAmount: data.minCuratorshipAmount ?? null,
        adoptedAt,
      },
    });

    await applyFeaturedFlag(ctx.shelterId, animalId, data.isFeatured);

    await handlePhotoUpload(formData, ctx.shelterId, animalId, data.isPublic);

    revalidateAnimalPaths(shelterSlug, data.slug);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return {
      error: e instanceof Error ? e.message : "Failed to update animal",
    };
  }

  redirect(`/uk/crm/${shelterSlug}/animals`);
}

export async function hideAnimalFromSiteAction(
  shelterSlug: string,
  animalId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  await prisma.animal.updateMany({
    where: { id: animalId, shelterId: ctx.shelterId },
    data: { isPublic: false, isFeatured: false },
  });

  revalidateAnimalPaths(shelterSlug);
  redirect(`/uk/crm/${shelterSlug}/animals`);
}

export async function permanentlyDeleteAnimalAction(
  shelterSlug: string,
  animalId: string,
): Promise<{ error?: string } | void> {
  const ctx = await requireShelterMember(shelterSlug);

  const animal = await prisma.animal.findFirst({
    where: { id: animalId, shelterId: ctx.shelterId },
    include: {
      sponsorships: {
        where: {
          status: {
            in: [SponsorshipStatus.ACTIVE, SponsorshipStatus.PENDING],
          },
        },
        select: { id: true },
      },
    },
  });

  if (!animal) {
    return { error: "Котика не знайдено" };
  }

  if (animal.sponsorships.length > 0) {
    return {
      error: "Неможливо видалити: є активне або очікуване кураторство",
    };
  }

  await deleteAllAnimalMedia(animalId);
  await prisma.animal.delete({ where: { id: animalId } });

  revalidateAnimalPaths(shelterSlug, animal.slug);
  redirect(`/uk/crm/${shelterSlug}/animals`);
}

/** @deprecated use hideAnimalFromSiteAction */
export async function deleteAnimalAction(
  shelterSlug: string,
  animalId: string,
) {
  return hideAnimalFromSiteAction(shelterSlug, animalId);
}
