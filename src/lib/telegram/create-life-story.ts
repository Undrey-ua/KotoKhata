import { LifeStoryType } from "@prisma/client";
import { createShelterPost } from "@/lib/shelter-posts";
import { downloadTelegramPhoto } from "@/lib/telegram/download";

export async function publishNewsFromTelegram({
  shelterId,
  authorId,
  type,
  animalId,
  content,
  photoFileId,
}: {
  shelterId: string;
  authorId: string;
  type: LifeStoryType;
  animalId?: string | null;
  content: string;
  photoFileId?: string;
}) {
  const photos: Array<{ buffer: Buffer; mimeType: string }> = [];

  if (photoFileId) {
    const { buffer, mimeType } = await downloadTelegramPhoto(photoFileId);
    photos.push({ buffer, mimeType });
  }

  return createShelterPost({
    shelterId,
    authorId,
    type,
    animalId,
    content,
    publish: true,
    photos,
  });
}
