/** Max items per list page (CRM + public site). */
export const LIST_PAGE_SIZE = 10;

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  skip: number;
};

export function parsePageParam(value: string | string[] | undefined): number {
  const raw = typeof value === "string" ? Number.parseInt(value, 10) : 1;
  if (!Number.isFinite(raw) || raw < 1) return 1;
  return raw;
}

export function buildPaginationMeta(
  total: number,
  page: number,
  pageSize = LIST_PAGE_SIZE,
) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const skip = (safePage - 1) * pageSize;

  return {
    total,
    page: safePage,
    pageSize,
    totalPages,
    hasMore: safePage < totalPages,
    skip,
    take: pageSize,
  };
}

export function toPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize = LIST_PAGE_SIZE,
): PaginatedResult<T> {
  const meta = buildPaginationMeta(total, page, pageSize);
  return { items, ...meta };
}

export type PageNumberItem = number | "ellipsis";

/** Page numbers for pagination UI, e.g. [1, 2, 3, "ellipsis", 8]. */
export function buildVisiblePageNumbers(
  page: number,
  totalPages: number,
): PageNumberItem[] {
  if (totalPages <= 1) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: PageNumberItem[] = [1];

  if (page > 3) {
    pages.push("ellipsis");
  }

  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  for (let current = start; current <= end; current += 1) {
    pages.push(current);
  }

  if (page < totalPages - 2) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

export function buildPageHref(
  pathname: string,
  searchParams: Record<string, string | undefined>,
  page: number,
) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value && key !== "page") {
      params.set(key, value);
    }
  }

  if (page > 1) {
    params.set("page", String(page));
  }

  const query = params.toString();
  return query ? `${pathname}?${query}` : pathname;
}
