import { AnimalSex } from "@prisma/client";
import type { CatalogAgeFilter } from "@/lib/animal-age";
import { catalogAgeFilters } from "@/lib/animal-age";

export const catalogSupportFilters = [
  "needs_curator",
  "has_curators",
  "adopted",
] as const;

export type CatalogSupportFilter = (typeof catalogSupportFilters)[number];

export type CatalogFilters = {
  sex?: AnimalSex;
  support?: CatalogSupportFilter;
  age?: CatalogAgeFilter;
  q?: string;
};

export function parseCatalogFilters(
  searchParams: Record<string, string | string[] | undefined>,
): CatalogFilters {
  const filters: CatalogFilters = {};
  const sex = searchParams.sex;
  const support = searchParams.support;
  const age = searchParams.age;
  const q = searchParams.q;

  if (
    typeof sex === "string" &&
    (Object.values(AnimalSex) as string[]).includes(sex)
  ) {
    filters.sex = sex as AnimalSex;
  }

  if (
    typeof support === "string" &&
    (catalogSupportFilters as readonly string[]).includes(support)
  ) {
    filters.support = support as CatalogSupportFilter;
  }

  if (
    typeof age === "string" &&
    (catalogAgeFilters as readonly string[]).includes(age)
  ) {
    filters.age = age as CatalogAgeFilter;
  }

  if (typeof q === "string") {
    const trimmed = q.trim();
    if (trimmed.length > 0) {
      filters.q = trimmed.slice(0, 80);
    }
  }

  return filters;
}

export function hasActiveFilters(filters: CatalogFilters) {
  return Boolean(filters.sex || filters.support || filters.age || filters.q);
}
