"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import type { CrmCuratorshipRow } from "@/lib/crm/curators-list";
import {
  countBySummaryBucket,
  type CuratorListFilter,
} from "@/lib/crm/curator-payment-status";
import { filterCuratorshipRows } from "@/lib/crm/search";
import { CuratorsTable } from "@/components/crm/curators-table";
import { CrmSearchBar } from "@/components/crm/crm-search-bar";
import { cn } from "@/lib/utils";

type CuratorsListPanelProps = {
  rows: CrmCuratorshipRow[];
  shelterSlug: string;
  locale?: string;
};

function SummaryCard({
  title,
  count,
  tone,
  active,
  onClick,
}: {
  title: string;
  count: number;
  tone: "good" | "warn" | "alert";
  active?: boolean;
  onClick?: () => void;
}) {
  const toneClass = {
    good: "border-emerald-200 bg-emerald-50/60",
    warn: "border-amber-200 bg-amber-50/60",
    alert: "border-red-200 bg-red-50/60",
  }[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-xl border p-3 text-left transition-shadow hover:shadow-sm",
        toneClass,
        active && "ring-2 ring-primary/30",
      )}
    >
      <p className="text-2xl font-bold text-foreground">{count}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{title}</p>
    </button>
  );
}

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

const FILTER_OPTIONS: { value: CuratorListFilter | ""; label: string }[] = [
  { value: "", label: "Усі" },
  { value: "all_active", label: "Активні куратори" },
  { value: "paused", label: "На паузі" },
  { value: "need_reminder", label: "Потрібно нагадати" },
  { value: "need_contact", label: "Потрібен контакт" },
  { value: "critical", label: "Без платежів 90+ днів" },
];

export function CuratorsListPanel({
  rows,
  shelterSlug,
  locale,
}: CuratorsListPanelProps) {
  const [query, setQuery] = useState("");
  const [listFilter, setListFilter] = useState<CuratorListFilter | "">("");

  const summary = useMemo(
    () =>
      countBySummaryBucket(
        rows.map((r) => ({ state: r.paymentState, curatorStatus: r.curatorStatus })),
      ),
    [rows],
  );

  const filtered = useMemo(
    () => filterCuratorshipRows(rows, query, listFilter),
    [rows, query, listFilter],
  );

  function applySummaryFilter(filter: CuratorListFilter) {
    setListFilter((current) => (current === filter ? "" : filter));
  }

  return (
    <>
      <div className="mt-5 grid gap-2 sm:grid-cols-3 sm:gap-3">
        <SummaryCard
          title="🟢 Все добре — платежі вчасно"
          count={summary.allGood}
          tone="good"
          active={listFilter === "all_active"}
          onClick={() => setListFilter((f) => (f === "all_active" ? "" : "all_active"))}
        />
        <SummaryCard
          title="🟡 Потрібно нагадати (30–90 днів)"
          count={summary.needReminder}
          tone="warn"
          active={listFilter === "need_reminder"}
          onClick={() => applySummaryFilter("need_reminder")}
        />
        <SummaryCard
          title="🔴 Потрібна увага (90+ днів)"
          count={summary.needAttention}
          tone="alert"
          active={listFilter === "need_contact"}
          onClick={() => applySummaryFilter("need_contact")}
        />
      </div>

      <CrmSearchBar
        value={query}
        onChange={setQuery}
        placeholder="Ім'я, email, телефон або кіт…"
        resultCount={filtered.length}
        totalCount={rows.length}
      />

      <div className="mt-3 flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map(({ value, label }) => (
          <FilterChip
            key={value || "all"}
            active={listFilter === value}
            onClick={() => setListFilter(value)}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <CuratorsTable
        rows={filtered}
        shelterSlug={shelterSlug}
        locale={locale}
        emptyMessage={
          query.trim() || listFilter
            ? "Нікого не знайдено за обраними фільтрами."
            : "Поки немає кураторів. Вони з'являться після оформлення кураторства на сайті."
        }
      />
    </>
  );
}
