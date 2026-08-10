import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CatFilters } from "@/components/catalog/cat-filters";
import { CatalogCatCard } from "@/components/catalog/catalog-cat-card";
import { JsonLd } from "@/components/seo/json-ld";
import { ListPagination } from "@/components/ui/list-pagination";
import {
  hasActiveFilters,
  parseCatalogFilters,
} from "@/lib/catalog-filters";
import { buildCatalogAnimalWhere } from "@/lib/catalog-query";
import { isAdopted } from "@/lib/animal-labels";
import { coverMediaUrl } from "@/lib/serialize";
import { getAnimalsFunding } from "@/lib/animal-funding";
import { parsePageParam } from "@/lib/pagination";
import { buildAbsoluteUrl, buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { name: true },
  });

  if (!shelter) {
    return {};
  }

  const tc = await getTranslations({ locale, namespace: "catalog" });

  return buildPageMetadata({
    locale,
    pathname: `/s/${shelterSlug}/cats`,
    title: `${tc("title")} — ${shelter.name}`,
    description: tc("subtitle"),
  });
}

export default async function CatsCatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
  searchParams: Promise<{
    sex?: string;
    support?: string;
    age?: string;
    q?: string;
    page?: string;
  }>;
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
  const page = parsePageParam(resolvedSearchParams.page);
  const where = buildCatalogAnimalWhere(shelter.id, filters);

  const [total, animals] = await Promise.all([
    prisma.animal.count({ where }),
    prisma.animal.findMany({
      where,
      orderBy: { name: "asc" },
      skip: (page - 1) * 10,
      take: 10,
      include: {
        media: {
          where: { type: "PHOTO", isPublic: true },
          orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
          take: 1,
        },
      },
    }),
  ]);

  const tc = await getTranslations("catalog");
  const tp = await getTranslations("pagination");
  const fundingByAnimal = await getAnimalsFunding(animals);
  const totalPages = Math.max(1, Math.ceil(total / 10));

  const paginationParams = {
    sex: filters.sex,
    support: filters.support,
    age: filters.age,
    q: filters.q,
  };

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${tc("title")} — ${shelter.name}`,
          numberOfItems: total,
          itemListElement: animals.map((animal, index) => ({
            "@type": "ListItem",
            position: (page - 1) * 10 + index + 1,
            url: buildAbsoluteUrl(
              locale,
              `/s/${shelterSlug}/cats/${animal.slug}`,
            ),
            name: animal.name,
          })),
        }}
      />
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
            resultCount={total}
          />

          {total === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border-cool bg-card/80 p-12 text-center text-muted-foreground">
              {filtered ? tc("noResults") : tc("empty")}
            </p>
          ) : (
            <>
              <ul className="mt-4 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 lg:grid-cols-4 lg:gap-4 sm:mt-6">
                {animals.map((animal) => {
                  const funding = fundingByAnimal.get(animal.id)!;
                  const underCuratorship =
                    funding.hasCurators &&
                    funding.fundedPercent != null &&
                    !isAdopted(animal.status);

                  return (
                    <li key={animal.id} className="h-full">
                      <CatalogCatCard
                        name={animal.name}
                        slug={animal.slug}
                        sex={animal.sex}
                        status={animal.status}
                        description={animal.description}
                        coverUrl={coverMediaUrl(animal.media)}
                        shelterSlug={shelterSlug}
                        funding={funding}
                        adoptedLabel={tc("adopted")}
                        fundedShortLabel={
                          underCuratorship
                            ? tc("fundedShort", { percent: funding.fundedPercent! })
                            : undefined
                        }
                      />
                    </li>
                  );
                })}
              </ul>

              <ListPagination
                page={page}
                totalPages={totalPages}
                total={total}
                pageSize={10}
                pathname={`/s/${shelterSlug}/cats`}
                searchParams={paginationParams}
                labels={{
                  range: tp("range"),
                  previous: tp("previous"),
                  loadMore: tp("loadMore"),
                  pageOf: tp("pageOf"),
                }}
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
