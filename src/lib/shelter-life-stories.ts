import { LifeStoryType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  buildPaginationMeta,
  LIST_PAGE_SIZE,
  toPaginatedResult,
  type PaginatedResult,
} from "@/lib/pagination";

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

export async function getPublicShelterFeedPaginated(
  shelterSlug: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<PaginatedResult<PublicFeedItem>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? LIST_PAGE_SIZE;
  const where = {
    isPublic: true,
    shelter: { slug: shelterSlug },
    OR: [
      { type: LifeStoryType.SHELTER_NEWS },
      {
        type: LifeStoryType.ANIMAL_STORY,
        animal: { isPublic: true },
      },
    ],
  };

  const meta = buildPaginationMeta(
    await prisma.lifeStory.count({ where }),
    page,
    pageSize,
  );

  const stories = await prisma.lifeStory.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip: meta.skip,
    take: meta.take,
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

  return toPaginatedResult(items, meta.total, meta.page, pageSize);
}

export async function getPublicShelterFeed(
  shelterSlug: string,
  limit = LIST_PAGE_SIZE,
): Promise<PublicFeedItem[]> {
  return (await getPublicShelterFeedPaginated(shelterSlug, { page: 1, pageSize: limit }))
    .items;
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
