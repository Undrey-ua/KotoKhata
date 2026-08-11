"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { CatalogCatCard } from "@/components/catalog/catalog-cat-card";
import { Button } from "@/components/ui/button";
import { isAdopted } from "@/lib/animal-labels";
import type { CatalogCatItem } from "@/lib/catalog-animals";
import type { CatalogFilters } from "@/lib/catalog-filters";
import {
  buildPageHref,
  buildVisiblePageNumbers,
  type PaginatedResult,
} from "@/lib/pagination";
import { cn } from "@/lib/utils";

type CatalogCatGridProps = {
  shelterSlug: string;
  initialData: PaginatedResult<CatalogCatItem>;
  filters: CatalogFilters;
};

function buildFilterParams(filters: CatalogFilters) {
  return {
    sex: filters.sex,
    support: filters.support,
    age: filters.age,
    q: filters.q,
  };
}

export function CatalogCatGrid({
  shelterSlug,
  initialData,
  filters,
}: CatalogCatGridProps) {
  const router = useRouter();
  const tc = useTranslations("catalog");
  const tp = useTranslations("pagination");
  const [items, setItems] = useState(initialData.items);
  const [loadedPage, setLoadedPage] = useState(initialData.page);
  const [total] = useState(initialData.total);
  const [totalPages] = useState(initialData.totalPages);
  const [loading, setLoading] = useState(false);

  const pathname = `/s/${shelterSlug}/cats`;
  const filterParams = buildFilterParams(filters);
  const pageNumbers = buildVisiblePageNumbers(initialData.page, totalPages);
  const hasMoreToLoad = items.length < total;
  const displayedFrom =
    items.length === 0 ? 0 : (initialData.page - 1) * initialData.pageSize + 1;
  const displayedTo = Math.min(
    (initialData.page - 1) * initialData.pageSize + items.length,
    total,
  );

  const loadMore = useCallback(async () => {
    if (loading || !hasMoreToLoad) return;

    setLoading(true);
    try {
      const nextPage = loadedPage + 1;
      const params = new URLSearchParams();

      for (const [key, value] of Object.entries(filterParams)) {
        if (value) params.set(key, value);
      }
      params.set("page", String(nextPage));

      const response = await fetch(
        `/api/s/${shelterSlug}/cats?${params.toString()}`,
      );

      if (!response.ok) return;

      const data = (await response.json()) as PaginatedResult<CatalogCatItem>;
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        const next = data.items.filter((item) => !seen.has(item.id));
        return [...current, ...next];
      });
      setLoadedPage(nextPage);
    } finally {
      setLoading(false);
    }
  }, [filterParams, hasMoreToLoad, loadedPage, loading, shelterSlug]);

  return (
    <>
      <ul className="mt-4 grid grid-cols-2 gap-2 min-[480px]:grid-cols-3 lg:grid-cols-4 lg:gap-4 sm:mt-6">
        {items.map((animal) => {
          const underCuratorship =
            animal.funding.hasCurators &&
            animal.funding.fundedPercent != null &&
            !isAdopted(animal.status);

          return (
            <li key={animal.id} className="h-full">
              <CatalogCatCard
                name={animal.name}
                slug={animal.slug}
                sex={animal.sex}
                status={animal.status}
                description={animal.description}
                coverUrl={animal.coverUrl}
                shelterSlug={shelterSlug}
                funding={animal.funding}
                adoptedLabel={tc("adopted")}
                fundedShortLabel={
                  underCuratorship
                    ? tc("fundedShort", {
                        percent: animal.funding.fundedPercent!,
                      })
                    : undefined
                }
              />
            </li>
          );
        })}
      </ul>

      {totalPages > 1 ? (
        <nav
          className="mt-6 flex flex-col gap-4 border-t border-border-cool pt-5 lg:flex-row lg:items-center lg:justify-between"
          aria-label="Пагінація"
        >
          <p className="text-sm text-muted-foreground">
            {tp("range", {
              from: displayedFrom,
              to: displayedTo,
              total,
            })}
            <span className="hidden sm:inline">
              {" · "}
              {tp("pageOf", {
                page: initialData.page,
                totalPages,
              })}
            </span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-1">
            {pageNumbers.map((pageNumber, index) =>
              pageNumber === "ellipsis" ? (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 text-sm text-muted-foreground"
                  aria-hidden
                >
                  …
                </span>
              ) : (
                <Button
                  key={pageNumber}
                  type="button"
                  variant={pageNumber === initialData.page ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "min-w-9 px-3",
                    pageNumber === initialData.page && "pointer-events-none",
                  )}
                  aria-current={
                    pageNumber === initialData.page ? "page" : undefined
                  }
                  onClick={() => {
                    router.push(
                      buildPageHref(pathname, filterParams, pageNumber),
                    );
                  }}
                >
                  {pageNumber}
                </Button>
              ),
            )}
          </div>

          {hasMoreToLoad ? (
            <Button
              type="button"
              size="sm"
              className="self-center lg:self-auto"
              disabled={loading}
              onClick={loadMore}
            >
              {loading ? "…" : tp("loadMore")}
            </Button>
          ) : (
            <span className="hidden lg:block lg:w-[140px]" aria-hidden />
          )}
        </nav>
      ) : null}
    </>
  );
}
