import { prisma } from "@/lib/db/prisma";

export type PublicLifeStoryItem = {
  id: string;
  content: string;
  publishedAt: Date | null;
  createdAt: Date;
  animal: {
    id: string;
    name: string;
    slug: string;
  };
  authorName: string | null;
  photoUrls: string[];
};

export async function getPublicShelterLifeStories(
  shelterSlug: string,
  limit = 50,
): Promise<PublicLifeStoryItem[]> {
  const stories = await prisma.lifeStory.findMany({
    where: {
      isPublic: true,
      animal: {
        isPublic: true,
        shelter: { slug: shelterSlug },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      animal: { select: { id: true, name: true, slug: true } },
      author: { select: { fullName: true } },
      media: {
        where: { type: "PHOTO", isPublic: true },
        orderBy: { createdAt: "asc" },
        select: { id: true },
      },
    },
  });

  return stories.map((story) => ({
    id: story.id,
    content: story.content,
    publishedAt: story.publishedAt,
    createdAt: story.createdAt,
    animal: story.animal,
    authorName: story.author.fullName,
    photoUrls: story.media.map((item) => `/api/media/${item.id}`),
  }));
}
