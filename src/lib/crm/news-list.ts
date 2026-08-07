import { prisma } from "@/lib/db/prisma";
import { LifeStoryType } from "@prisma/client";

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

export async function getCrmNewsList(shelterId: string): Promise<CrmNewsListItem[]> {
  const rows = await prisma.lifeStory.findMany({
    where: { shelterId },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { fullName: true } },
      animal: { select: { id: true, name: true, slug: true } },
      _count: { select: { media: true } },
    },
  });

  return rows.map((row) => ({
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
  }));
}

export async function getCrmAnimalsForNews(shelterId: string) {
  return prisma.animal.findMany({
    where: { shelterId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}
