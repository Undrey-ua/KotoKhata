"use client";

import { useMemo, useState } from "react";
import { permanentlyDeleteAnimalAction } from "@/actions/animals";
import type { CrmAnimalRow } from "@/lib/crm/animals-list";
import { matchesAnimalRow } from "@/lib/crm/search";
import { AnimalsTable } from "@/components/crm/animals-table";
import { CrmSearchBar } from "@/components/crm/crm-search-bar";

type AnimalsListPanelProps = {
  rows: CrmAnimalRow[];
  shelterSlug: string;
};

export function AnimalsListPanel({ rows, shelterSlug }: AnimalsListPanelProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(
    () => rows.filter((row) => matchesAnimalRow(row, query)),
    [rows, query],
  );

  return (
    <>
      <CrmSearchBar
        value={query}
        onChange={setQuery}
        placeholder="Ім'я, slug або куратор…"
        resultCount={filtered.length}
        totalCount={rows.length}
      />
      <AnimalsTable
        rows={filtered}
        shelterSlug={shelterSlug}
        onDelete={permanentlyDeleteAnimalAction.bind(null, shelterSlug)}
        emptyMessage={
          query.trim()
            ? "Нікого не знайдено за вашим запитом."
            : "Поки немає котиків. Додайте першого."
        }
      />
    </>
  );
}
