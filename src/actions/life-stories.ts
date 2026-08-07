"use server";

import { revalidatePath } from "next/cache";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { LifeStoryType } from "@prisma/client";
import { redirect } from "@/i18n/navigation";
import { requireShelterMember } from "@/lib/auth/session";
import {
  createShelterPost,
  deleteShelterPost,
  setShelterPostPublished,
} from "@/lib/shelter-posts";

function revalidateNewsPaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 5;

export async function createNewsAction(
  shelterSlug: string,
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const ctx = await requireShelterMember(shelterSlug);

  try {
    const typeRaw = formData.get("type")?.toString();
    const type =
      typeRaw === LifeStoryType.SHELTER_NEWS
        ? LifeStoryType.SHELTER_NEWS
        : LifeStoryType.ANIMAL_STORY;

    const content = formData.get("content")?.toString() ?? "";
    const title = formData.get("title")?.toString() ?? "";
    const animalId = formData.get("animalId")?.toString() || null;
    const publish = formData.get("publish") === "on";

    const photoFiles = formData
      .getAll("photos")
      .filter((item): item is File => item instanceof File && item.size > 0);

    if (photoFiles.length > MAX_PHOTOS) {
      return { error: `Можна додати не більше ${MAX_PHOTOS} фото.` };
    }

    for (const file of photoFiles) {
      if (file.size > MAX_PHOTO_BYTES) {
        return { error: "Кожне фото має бути не більше 5 МБ." };
      }
    }

    const photos = await Promise.all(
      photoFiles.map(async (file) => ({
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
      })),
    );

    const { revalidate } = await createShelterPost({
      shelterId: ctx.shelterId,
      authorId: ctx.userId,
      type,
      animalId,
      title: type === LifeStoryType.SHELTER_NEWS ? title : null,
      content,
      publish,
      photos,
    });

    revalidateNewsPaths(revalidate.paths);
    redirect(`/crm/${shelterSlug}/news`);
  } catch (error) {
    if (isRedirectError(error)) throw error;
    return {
      error: error instanceof Error ? error.message : "Не вдалося зберегти новину",
    };
  }
}

export async function toggleNewsPublishAction(
  shelterSlug: string,
  postId: string,
  publish: boolean,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const { revalidate } = await setShelterPostPublished(
    ctx.shelterId,
    postId,
    publish,
  );

  revalidateNewsPaths(revalidate.paths);
}

export async function deleteNewsAction(shelterSlug: string, postId: string) {
  const ctx = await requireShelterMember(shelterSlug);

  const { revalidate } = await deleteShelterPost(ctx.shelterId, postId);
  revalidateNewsPaths(revalidate.paths);
}
