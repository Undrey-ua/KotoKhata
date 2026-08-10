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
