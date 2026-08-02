"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { AnimalSex } from "@prisma/client";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { CatalogSupportFilter } from "@/lib/catalog-filters";
import { catalogAgeFilters, type CatalogAgeFilter } from "@/lib/animal-age";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CatFiltersProps = {
  currentSex?: AnimalSex;
  currentSupport?: CatalogSupportFilter;
  currentAge?: CatalogAgeFilter;
  currentQuery?: string;
  resultCount: number;
};

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "bg-surface-cool/80 text-muted-foreground hover:bg-surface-stone hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function CatFilters({
  currentSex,
  currentSupport,
  currentAge,
  currentQuery,
  resultCount,
}: CatFiltersProps) {
  const t = useTranslations("catalog");
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState(currentQuery ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setQuery(currentQuery ?? "");
  }, [currentQuery]);

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  function navigate(next: {
    sex?: AnimalSex | "";
    support?: CatalogSupportFilter | "";
    age?: CatalogAgeFilter | "";
    q?: string;
  }) {
    const params = new URLSearchParams();
    const sex = next.sex !== undefined ? next.sex : (currentSex ?? "");
    const support =
      next.support !== undefined ? next.support : (currentSupport ?? "");
    const age = next.age !== undefined ? next.age : (currentAge ?? "");
    const q = (next.q !== undefined ? next.q : (currentQuery ?? "")).trim();

    if (sex) params.set("sex", sex);
    if (support) params.set("support", support);
    if (age) params.set("age", age);
    if (q) params.set("q", q);

    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => navigate({ q: value }), 350);
  }

  const hasFilters = Boolean(
    currentSex || currentSupport || currentAge || currentQuery,
  );

  const sexOptions: { value: AnimalSex | ""; label: string }[] = [
    { value: "", label: t("all") },
    { value: AnimalSex.MALE, label: t("filterBoys") },
    { value: AnimalSex.FEMALE, label: t("filterGirls") },
  ];

  const supportOptions: { value: CatalogSupportFilter | ""; label: string }[] = [
    { value: "", label: t("all") },
    { value: "needs_curator", label: t("filterNeedsCurator") },
    { value: "has_curators", label: t("filterHasCurators") },
    { value: "adopted", label: t("filterAdopted") },
  ];

  const ageOptions: { value: CatalogAgeFilter | ""; label: string }[] = [
    { value: "", label: t("all") },
    ...catalogAgeFilters.map((value) => ({
      value,
      label: t(`filterAge_${value}`),
    })),
  ];

  return (
    <section className="mt-5 rounded-xl border border-border-cool/70 bg-card/90 p-3 shadow-sm sm:mt-6 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-foreground">{t("filtersTitle")}</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground sm:text-sm">
            {t("found", { count: resultCount })}
          </span>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                router.replace(pathname);
              }}
              className="text-xs font-medium text-primary hover:underline sm:text-sm"
            >
              {t("clear")}
            </button>
          )}
        </div>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="h-10 pl-9"
          aria-label={t("search")}
        />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:gap-6">
        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("sex")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {sexOptions.map(({ value, label }) => (
              <FilterChip
                key={value || "all-sex"}
                active={(currentSex ?? "") === value}
                onClick={() => navigate({ sex: value })}
              >
                {label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("support")}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {supportOptions.map(({ value, label }) => (
              <FilterChip
                key={value || "all-support"}
                active={(currentSupport ?? "") === value}
                onClick={() => navigate({ support: value })}
              >
                {label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("age")}
        </p>
        <div className="flex flex-wrap gap-1.5">
          {ageOptions.map(({ value, label }) => (
            <FilterChip
              key={value || "all-age"}
              active={(currentAge ?? "") === value}
              onClick={() => navigate({ age: value })}
            >
              {label}
            </FilterChip>
          ))}
        </div>
      </div>
    </section>
  );
}
