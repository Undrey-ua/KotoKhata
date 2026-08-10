import { setRequestLocale, getTranslations } from "next-intl/server";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { CatFilters } from "@/components/catalog/cat-filters";
import { CatalogCatGrid } from "@/components/catalog/catalog-cat-grid";
import { JsonLd } from "@/components/seo/json-ld";
import {
  hasActiveFilters,
  parseCatalogFilters,
} from "@/lib/catalog-filters";
import { getCatalogCatsPaginated } from "@/lib/catalog-animals";
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
  const catalog = await getCatalogCatsPaginated(shelter.id, filters, page);

  const tc = await getTranslations("catalog");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `${tc("title")} — ${shelter.name}`,
          numberOfItems: catalog.total,
          itemListElement: catalog.items.map((animal, index) => ({
            "@type": "ListItem",
            position: (catalog.page - 1) * catalog.pageSize + index + 1,
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
            resultCount={catalog.total}
          />

          {catalog.total === 0 ? (
            <p className="mt-8 rounded-2xl border border-dashed border-border-cool bg-card/80 p-12 text-center text-muted-foreground">
              {filtered ? tc("noResults") : tc("empty")}
            </p>
          ) : (
            <CatalogCatGrid
              key={[catalog.page, filters.sex, filters.support, filters.age, filters.q]
                .filter(Boolean)
                .join("-")}
              shelterSlug={shelterSlug}
              initialData={catalog}
              filters={filters}
            />
          )}
        </div>
      </div>
    </>
  );
}
