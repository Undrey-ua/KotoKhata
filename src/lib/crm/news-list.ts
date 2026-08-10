import { prisma } from "@/lib/db/prisma";
import { LifeStoryType } from "@prisma/client";
import {
  buildPaginationMeta,
  LIST_PAGE_SIZE,
  toPaginatedResult,
  type PaginatedResult,
} from "@/lib/pagination";

export type CrmNewsListItem = {
  id: string;
  type: LifeStoryType;
  title: string | null;
  content: string;
  isPublic: boolean;
  publishedAt: Date | null;
  createdAt: Date;
  authorName: string | null;
  animal: { id: string; name: string; slug: string } | null;
  photoCount: number;
};

export async function countCrmPublishedNews(shelterId: string) {
  return prisma.lifeStory.count({
    where: { shelterId, isPublic: true },
  });
}

export async function getCrmNewsListPaginated(
  shelterId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<PaginatedResult<CrmNewsListItem>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? LIST_PAGE_SIZE;
  const meta = buildPaginationMeta(
    await prisma.lifeStory.count({ where: { shelterId } }),
    page,
    pageSize,
  );

  const rows = await prisma.lifeStory.findMany({
    where: { shelterId },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    skip: meta.skip,
    take: meta.take,
    include: {
      author: { select: { fullName: true } },
      animal: { select: { id: true, name: true, slug: true } },
      _count: { select: { media: true } },
    },
  });

  return toPaginatedResult(
    rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      isPublic: row.isPublic,
      publishedAt: row.publishedAt,
      createdAt: row.createdAt,
      authorName: row.author.fullName,
      animal: row.animal,
      photoCount: row._count.media,
    })),
    meta.total,
    meta.page,
    pageSize,
  );
}

export async function getCrmNewsList(shelterId: string): Promise<CrmNewsListItem[]> {
  return (await getCrmNewsListPaginated(shelterId, { page: 1, pageSize: 10_000 }))
    .items;
}

export async function getCrmAnimalsForNews(shelterId: string) {
  return prisma.animal.findMany({
    where: { shelterId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
