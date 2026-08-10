import { AnimalStatus, type AnimalSex, type Prisma } from "@prisma/client";
import type { CatalogAgeFilter } from "@/lib/animal-age";
import type { CatalogFilters, CatalogSupportFilter } from "@/lib/catalog-filters";

function subtractMonths(from: Date, months: number) {
  const date = new Date(from);
  date.setMonth(date.getMonth() - months);
  return date;
}

export function buildCatalogAgeBirthDateFilter(
  age: CatalogAgeFilter,
  now = new Date(),
): Prisma.AnimalWhereInput {
  const withBirthDate = { birthDate: { not: null } } satisfies Prisma.AnimalWhereInput;

  switch (age) {
    case "under_1":
      return {
        AND: [withBirthDate, { birthDate: { gt: subtractMonths(now, 12) } }],
      };
    case "1_5":
      return {
        AND: [
          withBirthDate,
          { birthDate: { lte: subtractMonths(now, 12) } },
          { birthDate: { gt: subtractMonths(now, 60) } },
        ],
      };
    case "5_10":
      return {
        AND: [
          withBirthDate,
          { birthDate: { lte: subtractMonths(now, 60) } },
          { birthDate: { gt: subtractMonths(now, 120) } },
        ],
      };
    case "10_plus":
      return {
        AND: [withBirthDate, { birthDate: { lte: subtractMonths(now, 120) } }],
      };
    default:
      return withBirthDate;
  }
}

function buildSupportFilter(
  support: CatalogSupportFilter,
): Pick<Prisma.AnimalWhereInput, "status" | "sponsorships"> {
  switch (support) {
    case "adopted":
      return { status: AnimalStatus.ADOPTED };
    case "has_curators":
      return {
        status: { not: AnimalStatus.ADOPTED },
        sponsorships: { some: { status: "ACTIVE" } },
      };
    case "needs_curator":
      return {
        status: { not: AnimalStatus.ADOPTED },
        sponsorships: { none: { status: "ACTIVE" } },
      };
    default:
      return {};
  }
}

export function buildCatalogAnimalWhere(
  shelterId: string,
  filters: CatalogFilters,
): Prisma.AnimalWhereInput {
  const where: Prisma.AnimalWhereInput = {
    shelterId,
    isPublic: true,
  };

  if (filters.sex) {
    where.sex = filters.sex as AnimalSex;
  }

  if (filters.q) {
    where.OR = [
      { name: { contains: filters.q, mode: "insensitive" } },
      { description: { contains: filters.q, mode: "insensitive" } },
    ];
  }

  if (filters.age) {
    Object.assign(where, buildCatalogAgeBirthDateFilter(filters.age));
  }

  if (filters.support) {
    Object.assign(where, buildSupportFilter(filters.support));
  }

  return where;
}
