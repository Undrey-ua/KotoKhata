import { LifeStoryType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type PublicFeedItem =
  | {
      id: string;
      type: "ANIMAL_STORY";
      content: string;
      publishedAt: Date | null;
      createdAt: Date;
      animal: { id: string; name: string; slug: string };
      authorName: string | null;
      photoUrls: string[];
    }
  | {
      id: string;
      type: "SHELTER_NEWS";
      title: string | null;
      content: string;
      publishedAt: Date | null;
      createdAt: Date;
      authorName: string | null;
      photoUrls: string[];
    };

export async function getPublicShelterFeed(
  shelterSlug: string,
  limit = 50,
): Promise<PublicFeedItem[]> {
  const stories = await prisma.lifeStory.findMany({
    where: {
      isPublic: true,
      shelter: { slug: shelterSlug },
      OR: [
        { type: LifeStoryType.SHELTER_NEWS },
        {
          type: LifeStoryType.ANIMAL_STORY,
          animal: { isPublic: true },
        },
      ],
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

  const items: PublicFeedItem[] = [];

  for (const story of stories) {
    const base = {
      id: story.id,
      content: story.content,
      publishedAt: story.publishedAt,
      createdAt: story.createdAt,
      authorName: story.author.fullName,
      photoUrls: story.media.map((item) => `/api/media/${item.id}`),
    };

    if (story.type === LifeStoryType.SHELTER_NEWS) {
      items.push({
        ...base,
        type: "SHELTER_NEWS",
        title: story.title,
      });
      continue;
    }

    if (story.animal) {
      items.push({
        ...base,
        type: "ANIMAL_STORY",
        animal: story.animal,
      });
    }
  }

  return items;
}

/** @deprecated Use getPublicShelterFeed */
export type PublicLifeStoryItem = Extract<
  PublicFeedItem,
  { type: "ANIMAL_STORY" }
>;

/** @deprecated Use getPublicShelterFeed */
export async function getPublicShelterLifeStories(
  shelterSlug: string,
  limit = 50,
) {
  const feed = await getPublicShelterFeed(shelterSlug, limit);
  return feed.filter(
    (item): item is PublicLifeStoryItem => item.type === "ANIMAL_STORY",
  );
}
