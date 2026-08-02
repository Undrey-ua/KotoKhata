import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CatFilters } from "@/components/catalog/cat-filters";
import { CatalogCatCard } from "@/components/catalog/catalog-cat-card";
import {
  hasActiveFilters,
  parseCatalogFilters,
} from "@/lib/catalog-filters";
import { isAdopted } from "@/lib/animal-labels";
import { matchesCatalogAgeFilter } from "@/lib/animal-age";
import { coverMediaUrl } from "@/lib/serialize";
import { getAnimalsFunding } from "@/lib/animal-funding";

export const dynamic = "force-dynamic";

export default async function CatsCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
  searchParams: Promise<{ sex?: string; support?: string; age?: string; q?: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);

  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
  });

  if (!shelter) {
    notFound();
  }

  const filters = parseCatalogFilters(resolvedSearchParams);
  const filtered = hasActiveFilters(filters);

  const animals = await prisma.animal.findMany({
    where: {
      shelterId: shelter.id,
      isPublic: true,
      ...(filters.sex && { sex: filters.sex }),
      ...(filters.q && {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { description: { contains: filters.q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: { createdAt: "desc" },
    include: {
      media: {
        where: { type: "PHOTO", isPublic: true },
        orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
    },
  });

  const tc = await getTranslations("catalog");
  const fundingByAnimal = await getAnimalsFunding(animals);

  const visibleAnimals = animals.filter((animal) => {
    const funding = fundingByAnimal.get(animal.id)!;

    if (filters.age && !matchesCatalogAgeFilter(animal.birthDate, filters.age)) {
      return false;
    }

    switch (filters.support) {
      case "adopted":
        return isAdopted(animal.status);
      case "has_curators":
        return funding.hasCurators && !isAdopted(animal.status);
      case "needs_curator":
        return !funding.hasCurators && !isAdopted(animal.status);
      default:
        return true;
    }
  });

  const sortedAnimals = [...visibleAnimals].sort((a, b) => {
    const aFund = fundingByAnimal.get(a.id)!;
    const bFund = fundingByAnimal.get(b.id)!;
    if (aFund.hasCurators !== bFund.hasCurators) {
      return aFund.hasCurators ? -1 : 1;
    }
    return a.name.localeCompare(b.name, locale === "uk" ? "uk" : "en");
  });

  return (
    <div className="min-h-full bg-gradient-to-b from-surface-cool/80 to-background">
      <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-14">
        <header className="mb-5 max-w-2xl sm:mb-8">
          <Link
            href={`/s/${shelterSlug}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {shelter.name}
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:mt-3 sm:text-4xl">
            {tc("title")}
          </h1>
          <p className="mt-2 text-muted-foreground">{tc("subtitle")}</p>
        </header>

        <CatFilters
          currentSex={filters.sex}
          currentSupport={filters.support}
          currentAge={filters.age}
          currentQuery={filters.q}
          resultCount={sortedAnimals.length}
        />

        {sortedAnimals.length === 0 ? (
          <p className="mt-8 rounded-2xl border border-dashed border-border-cool bg-card/80 p-12 text-center text-muted-foreground">
            {filtered ? tc("noResults") : tc("empty")}
          </p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 lg:grid-cols-4 lg:gap-4 sm:mt-6">
            {sortedAnimals.map((animal) => (
              <li key={animal.id} className="h-full">
                <CatalogCatCard
                  name={animal.name}
                  slug={animal.slug}
                  sex={animal.sex}
                  status={animal.status}
                  description={animal.description}
                  coverUrl={coverMediaUrl(animal.media)}
                  shelterSlug={shelterSlug}
                  funding={fundingByAnimal.get(animal.id)!}
                  locale={locale}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
