import type { CrmCuratorshipRow } from "@/lib/crm/curators-list";
import type { CrmAnimalRow } from "@/lib/crm/animals-list";
import type { CuratorListFilter } from "@/lib/crm/curator-payment-status";
import { matchesCuratorListFilter } from "@/lib/crm/curator-payment-status";

export function normalizeCrmSearch(query: string) {
  return query.trim().toLowerCase();
}

export function matchesAnimalRow(row: CrmAnimalRow, query: string) {
  const q = normalizeCrmSearch(query);
  if (!q) return true;

  if (row.name.toLowerCase().includes(q)) return true;
  if (row.slug.toLowerCase().includes(q)) return true;
  if (row.curators.some((c) => c.name.toLowerCase().includes(q))) return true;

  return false;
}

export function matchesCuratorshipRow(row: CrmCuratorshipRow, query: string) {
  const q = normalizeCrmSearch(query);
  if (!q) return true;

  if (row.curatorName.toLowerCase().includes(q)) return true;
  if (row.email.toLowerCase().includes(q)) return true;
  if (row.phone?.toLowerCase().includes(q)) return true;
  if (row.animalName.toLowerCase().includes(q)) return true;

  return false;
}

/** @deprecated */
export function matchesCuratorRow(
  row: { name: string; email: string; phone: string | null; wards: { animalName: string }[] },
  query: string,
) {
  const q = normalizeCrmSearch(query);
  if (!q) return true;
  if (row.name.toLowerCase().includes(q)) return true;
  if (row.email.toLowerCase().includes(q)) return true;
  if (row.phone?.toLowerCase().includes(q)) return true;
  if (row.wards.some((w) => w.animalName.toLowerCase().includes(q))) return true;
  return false;
}

export function filterCuratorshipRows(
  rows: CrmCuratorshipRow[],
  query: string,
  listFilter: CuratorListFilter | "",
) {
  return rows.filter((row) => {
    if (!matchesCuratorshipRow(row, query)) return false;
    if (listFilter && !matchesCuratorListFilter(row.paymentState, row.curatorStatus, listFilter)) {
      return false;
    }
    return true;
  });
}
