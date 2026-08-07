import { LifeStoryType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { uploadPostPhotoBuffer } from "@/lib/storage/media";

export type CreatePostInput = {
  shelterId: string;
  authorId: string;
  type: LifeStoryType;
  animalId?: string | null;
  title?: string | null;
  content: string;
  publish?: boolean;
  photos?: Array<{ buffer: Buffer; mimeType: string }>;
};

function revalidateTargets(shelterSlug: string, animalSlug?: string) {
  return {
    paths: [
      `/s/${shelterSlug}/life`,
      `/crm/${shelterSlug}/news`,
      "/uk",
      "/en",
      ...(animalSlug ? [`/s/${shelterSlug}/cats/${animalSlug}`] : []),
    ],
  };
}

export async function createShelterPost(input: CreatePostInput) {
  const { shelterId, authorId, type, content, publish = false } = input;

  if (type === LifeStoryType.ANIMAL_STORY && !input.animalId) {
    throw new Error("Animal is required for cat stories");
  }

  if (type === LifeStoryType.SHELTER_NEWS && input.animalId) {
    throw new Error("Shelter news cannot be linked to a cat");
  }

  const trimmedContent = content.trim();
  if (!trimmedContent) {
    throw new Error("Content is required");
  }

  if (type === LifeStoryType.ANIMAL_STORY && input.animalId) {
    const animal = await prisma.animal.findFirst({
      where: { id: input.animalId, shelterId },
      select: { id: true },
    });
    if (!animal) {
      throw new Error("Cat not found in this shelter");
    }
  }

  const now = publish ? new Date() : null;

  const story = await prisma.lifeStory.create({
    data: {
      shelterId,
      authorId,
      type,
      animalId: type === LifeStoryType.ANIMAL_STORY ? input.animalId! : null,
      title: input.title?.trim() || null,
      content: trimmedContent,
      isPublic: publish,
      publishedAt: now,
    },
    include: {
      animal: { select: { slug: true } },
      shelter: { select: { slug: true } },
    },
  });

  if (input.photos?.length) {
    for (const photo of input.photos) {
      await uploadPostPhotoBuffer({
        shelterId,
        lifeStoryId: story.id,
        animalId: story.animalId,
        buffer: photo.buffer,
        mimeType: photo.mimeType,
        isPublic: publish,
      });
    }
  }

  return {
    story,
    revalidate: revalidateTargets(story.shelter.slug, story.animal?.slug),
  };
}

export async function setShelterPostPublished(
  shelterId: string,
  postId: string,
  publish: boolean,
) {
  const story = await prisma.lifeStory.findFirst({
    where: { id: postId, shelterId },
    include: {
      animal: { select: { slug: true } },
      shelter: { select: { slug: true } },
    },
  });

  if (!story) {
    throw new Error("Post not found");
  }

  const updated = await prisma.lifeStory.update({
    where: { id: postId },
    data: {
      isPublic: publish,
      publishedAt: publish ? (story.publishedAt ?? new Date()) : null,
    },
  });

  await prisma.media.updateMany({
    where: { lifeStoryId: postId },
    data: { isPublic: publish },
  });

  return {
    story: updated,
    revalidate: revalidateTargets(story.shelter.slug, story.animal?.slug ?? undefined),
  };
}

export async function deleteShelterPost(shelterId: string, postId: string) {
  const story = await prisma.lifeStory.findFirst({
    where: { id: postId, shelterId },
    include: {
      animal: { select: { slug: true } },
      shelter: { select: { slug: true } },
      media: { select: { storagePath: true } },
    },
  });

  if (!story) {
    throw new Error("Post not found");
  }

  if (story.media.length) {
    const { createAdminClient } = await import("@/lib/storage/supabase-admin");
    const { ANIMAL_MEDIA_BUCKET } = await import("@/lib/constants");
    const supabase = createAdminClient();
    await supabase.storage
      .from(ANIMAL_MEDIA_BUCKET)
      .remove(story.media.map((m) => m.storagePath));
  }

  await prisma.lifeStory.delete({ where: { id: postId } });

  return {
    revalidate: revalidateTargets(story.shelter.slug, story.animal?.slug ?? undefined),
  };
}
