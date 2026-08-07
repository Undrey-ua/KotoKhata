import { randomUUID } from "crypto";
import { MediaType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ANIMAL_MEDIA_BUCKET } from "@/lib/constants";
import { resolveMediaDisplayUrl } from "@/lib/serialize";
import { createAdminClient } from "@/lib/storage/supabase-admin";

function extensionFromMime(mime: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return map[mime] ?? "jpg";
}

async function uploadAnimalPhotoBufferInternal({
  shelterId,
  animalId,
  buffer,
  mimeType,
  isCover = false,
  isPublic = true,
}: {
  shelterId: string;
  animalId: string;
  buffer: Buffer;
  mimeType: string;
  isCover?: boolean;
  isPublic?: boolean;
}) {
  if (!buffer.length) {
    throw new Error("File is empty");
  }

  if (!mimeType.startsWith("image/")) {
    throw new Error("Only images are allowed");
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Max file size is 5 MB");
  }

  const supabase = createAdminClient();
  const ext = extensionFromMime(mimeType);
  const storagePath = `${shelterId}/${animalId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ANIMAL_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      uploadError.message.includes("Bucket not found")
        ? `Create Supabase Storage bucket "${ANIMAL_MEDIA_BUCKET}" (public)`
        : uploadError.message,
    );
  }

  const { data: urlData } = supabase.storage
    .from(ANIMAL_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  if (isCover) {
    await prisma.media.updateMany({
      where: { animalId, isCover: true },
      data: { isCover: false },
    });
  }

  const media = await prisma.media.create({
    data: {
      animalId,
      type: MediaType.PHOTO,
      storagePath,
      publicUrl: urlData.publicUrl,
      mimeType,
      fileSize: buffer.length,
      isPublic,
      isCover,
    },
  });

  return media;
}

export async function uploadPostPhotoBuffer({
  shelterId,
  lifeStoryId,
  animalId,
  buffer,
  mimeType,
  isPublic = true,
}: {
  shelterId: string;
  lifeStoryId: string;
  animalId?: string | null;
  buffer: Buffer;
  mimeType: string;
  isPublic?: boolean;
}) {
  if (!buffer.length) {
    throw new Error("File is empty");
  }

  if (!mimeType.startsWith("image/")) {
    throw new Error("Only images are allowed");
  }

  if (buffer.length > 5 * 1024 * 1024) {
    throw new Error("Max file size is 5 MB");
  }

  const supabase = createAdminClient();
  const ext = extensionFromMime(mimeType);
  const storagePath = `${shelterId}/posts/${lifeStoryId}/${randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(ANIMAL_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(
      uploadError.message.includes("Bucket not found")
        ? `Create Supabase Storage bucket "${ANIMAL_MEDIA_BUCKET}" (public)`
        : uploadError.message,
    );
  }

  const { data: urlData } = supabase.storage
    .from(ANIMAL_MEDIA_BUCKET)
    .getPublicUrl(storagePath);

  return prisma.media.create({
    data: {
      animalId: animalId ?? null,
      lifeStoryId,
      type: MediaType.PHOTO,
      storagePath,
      publicUrl: urlData.publicUrl,
      mimeType,
      fileSize: buffer.length,
      isPublic,
      isCover: false,
    },
  });
}

export async function uploadAnimalPhoto({
  shelterId,
  animalId,
  file,
  isCover = false,
  isPublic = true,
}: {
  shelterId: string;
  animalId: string;
  file: File;
  isCover?: boolean;
  isPublic?: boolean;
}) {
  if (!file.size) {
    throw new Error("File is empty");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  return uploadAnimalPhotoBufferInternal({
    shelterId,
    animalId,
    buffer,
    mimeType: file.type,
    isCover,
    isPublic,
  });
}

export async function uploadAnimalPhotoBuffer({
  shelterId,
  animalId,
  buffer,
  mimeType,
  isCover = false,
  isPublic = true,
}: {
  shelterId: string;
  animalId: string;
  buffer: Buffer;
  mimeType: string;
  isCover?: boolean;
  isPublic?: boolean;
}) {
  return uploadAnimalPhotoBufferInternal({
    shelterId,
    animalId,
    buffer,
    mimeType,
    isCover,
    isPublic,
  });
}

export async function setAnimalCoverPhoto(mediaId: string, animalId: string) {
  await prisma.media.updateMany({
    where: { animalId, isCover: true },
    data: { isCover: false },
  });

  await prisma.media.update({
    where: { id: mediaId, animalId },
    data: { isCover: true },
  });
}

export async function deleteAnimalPhoto(mediaId: string, animalId: string) {
  const media = await prisma.media.findFirst({
    where: { id: mediaId, animalId },
  });

  if (!media) return;

  const supabase = createAdminClient();
  await supabase.storage.from(ANIMAL_MEDIA_BUCKET).remove([media.storagePath]);

  await prisma.media.delete({ where: { id: mediaId } });
}

export async function deleteAllAnimalMedia(animalId: string) {
  const media = await prisma.media.findMany({
    where: { animalId },
    select: { id: true, storagePath: true },
  });

  if (media.length === 0) return;

  const supabase = createAdminClient();
  await supabase.storage
    .from(ANIMAL_MEDIA_BUCKET)
    .remove(media.map((m) => m.storagePath));

  await prisma.media.deleteMany({ where: { animalId } });
}

export async function getAnimalCoverUrl(animalId: string) {
  const cover = await prisma.media.findFirst({
    where: { animalId, type: MediaType.PHOTO, isCover: true },
    select: { id: true, publicUrl: true, isPublic: true },
  });

  if (cover) return resolveMediaDisplayUrl(cover);

  const first = await prisma.media.findFirst({
    where: { animalId, type: MediaType.PHOTO, isPublic: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, publicUrl: true, isPublic: true },
  });

  return first ? resolveMediaDisplayUrl(first) : null;
}
