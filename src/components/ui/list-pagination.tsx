import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { buildPageHref } from "@/lib/pagination";
import { cn } from "@/lib/utils";

type ListPaginationLabels = {
  range: string;
  previous: string;
  loadMore: string;
  pageOf: string;
};

const defaultLabels: ListPaginationLabels = {
  range: "{from}–{to} з {total}",
  previous: "← Назад",
  loadMore: "Завантажити далі",
  pageOf: "Сторінка {page} з {totalPages}",
};

type ListPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  pathname: string;
  searchParams?: Record<string, string | undefined>;
  className?: string;
  labels?: Partial<ListPaginationLabels>;
};

function formatLabel(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? ""),
  );
}

export function ListPagination({
  page,
  totalPages,
  total,
  pageSize,
  pathname,
  searchParams = {},
  className,
  labels: labelOverrides,
}: ListPaginationProps) {
  if (totalPages <= 1) return null;

  const labels = { ...defaultLabels, ...labelOverrides };
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const prevHref = buildPageHref(pathname, searchParams, page - 1);
  const nextHref = buildPageHref(pathname, searchParams, page + 1);

  return (
    <nav
      className={cn(
        "mt-6 flex flex-col items-center gap-3 border-t border-border-cool pt-5 sm:flex-row sm:justify-between",
        className,
      )}
      aria-label="Пагінація"
    >
      <p className="text-sm text-muted-foreground">
        {formatLabel(labels.range, { from, to, total })}
        <span className="hidden sm:inline">
          {" · "}
          {formatLabel(labels.pageOf, { page, totalPages })}
        </span>
      </p>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {page > 1 ? (
          <Button asChild variant="outline" size="sm">
            <Link href={prevHref}>{labels.previous}</Link>
          </Button>
        ) : null}

        {page < totalPages ? (
          <Button asChild size="sm">
            <Link href={nextHref}>{labels.loadMore}</Link>
          </Button>
        ) : null}
      </div>
    </nav>
  );
}
