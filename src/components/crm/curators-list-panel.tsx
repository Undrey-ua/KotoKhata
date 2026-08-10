"use client";

import type { CrmCuratorshipRow } from "@/lib/crm/curators-list";
import { CuratorsTable } from "@/components/crm/curators-table";
import { CrmSearchForm } from "@/components/crm/crm-search-form";
import { cn } from "@/lib/utils";

type CuratorsListPanelProps = {
  rows: CrmCuratorshipRow[];
  shelterSlug: string;
  locale?: string;
  searchQuery?: string;
  totalCount?: number;
  summary: {
    allGood: number;
    needReminder: number;
    needAttention: number;
  };
};

function SummaryCard({
  title,
  shortTitle,
  count,
  tone,
}: {
  title: string;
  shortTitle?: string;
  count: number;
  tone: "good" | "warn" | "alert";
}) {
  const toneClass = {
    good: "border-emerald-200 bg-emerald-50/60",
    warn: "border-amber-200 bg-amber-50/60",
    alert: "border-red-200 bg-red-50/60",
  }[tone];

  return (
    <div
      className={cn(
        "rounded-xl border p-3 text-left",
        toneClass,
      )}
    >
      <p className="text-2xl font-bold text-foreground">{count}</p>
      <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
        <span className="sm:hidden">{shortTitle ?? title}</span>
        <span className="hidden sm:inline">{title}</span>
      </p>
    </div>
  );
}

export function CuratorsListPanel({
  rows,
  shelterSlug,
  locale,
  searchQuery = "",
  totalCount,
  summary,
}: CuratorsListPanelProps) {
  return (
    <>
      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        <SummaryCard
          title="🟢 Все добре — платежі вчасно"
          shortTitle="Все добре"
          count={summary.allGood}
          tone="good"
        />
        <SummaryCard
          title="🟡 Потрібно нагадати (30–90 днів)"
          shortTitle="Нагадати"
          count={summary.needReminder}
          tone="warn"
        />
        <SummaryCard
          title="🔴 Потрібна увага (90+ днів)"
          shortTitle="Увага"
          count={summary.needAttention}
          tone="alert"
        />
      </div>

      <CrmSearchForm
        defaultValue={searchQuery}
        placeholder="Ім'я, email, телефон або кіт…"
        totalCount={totalCount}
      />

      <CuratorsTable
        rows={rows}
        shelterSlug={shelterSlug}
        locale={locale}
        emptyMessage={
          searchQuery.trim()
            ? "Нікого не знайдено за вашим запитом."
            : "Поки немає кураторів. Вони з'являться після оформлення кураторства на сайті."
        }
      />
    </>
  );
}
