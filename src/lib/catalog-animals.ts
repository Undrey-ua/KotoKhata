import type { AnimalSex, AnimalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  getAnimalsFunding,
  type AnimalFundingInfo,
} from "@/lib/animal-funding";
import { buildCatalogAnimalWhere } from "@/lib/catalog-query";
import type { CatalogFilters } from "@/lib/catalog-filters";
import {
  CATALOG_PAGE_SIZE,
  parsePageParam,
  toPaginatedResult,
  type PaginatedResult,
} from "@/lib/pagination";
import { coverMediaUrl } from "@/lib/serialize";

export type CatalogCatItem = {
  id: string;
  name: string;
  slug: string;
  sex: AnimalSex;
  status: AnimalStatus;
  description: string | null;
  coverUrl: string | null;
  funding: AnimalFundingInfo;
};

export async function getCatalogCatsPaginated(
  shelterId: string,
  filters: CatalogFilters,
  page: number,
): Promise<PaginatedResult<CatalogCatItem>> {
  const where = buildCatalogAnimalWhere(shelterId, filters);
  const requestedPage = parsePageParam(String(page));
  const skip = (requestedPage - 1) * CATALOG_PAGE_SIZE;

  const [total, animals] = await Promise.all([
    prisma.animal.count({ where }),
    prisma.animal.findMany({
      where,
      orderBy: { name: "asc" },
      skip,
      take: CATALOG_PAGE_SIZE,
      include: {
        media: {
          where: { type: "PHOTO", isPublic: true },
          orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
      },
    }),
  ]);

  const fundingByAnimal = await getAnimalsFunding(animals);
  const items = animals.map((animal) => ({
    id: animal.id,
    name: animal.name,
    slug: animal.slug,
    sex: animal.sex,
    status: animal.status,
    description: animal.description,
    coverUrl: coverMediaUrl(animal.media),
    funding: fundingByAnimal.get(animal.id)!,
  }));

  return toPaginatedResult(items, total, requestedPage, CATALOG_PAGE_SIZE);
}
