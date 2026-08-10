"use client";

import { permanentlyDeleteAnimalAction } from "@/actions/animals";
import type { CrmAnimalRow } from "@/lib/crm/animals-list";
import { AnimalsTable } from "@/components/crm/animals-table";
import { CrmSearchForm } from "@/components/crm/crm-search-form";

type AnimalsListPanelProps = {
  rows: CrmAnimalRow[];
  shelterSlug: string;
  searchQuery?: string;
  totalCount?: number;
};

export function AnimalsListPanel({
  rows,
  shelterSlug,
  searchQuery = "",
  totalCount,
}: AnimalsListPanelProps) {
  return (
    <>
      <CrmSearchForm
        defaultValue={searchQuery}
        placeholder="Ім'я, slug або куратор…"
        totalCount={totalCount}
      />
      <AnimalsTable
        rows={rows}
        shelterSlug={shelterSlug}
        onDelete={permanentlyDeleteAnimalAction.bind(null, shelterSlug)}
        emptyMessage={
          searchQuery.trim()
            ? "Нікого не знайдено за вашим запитом."
            : "Поки немає котиків. Додайте першого."
        }
      />
    </>
  );
}
