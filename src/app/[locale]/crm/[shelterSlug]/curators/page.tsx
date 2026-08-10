import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import {
  countCrmCuratorshipsByStatus,
  getCrmCuratorshipsListPaginated,
  getCuratorshipSummaryCounts,
} from "@/lib/crm/curators-list";
import { parsePageParam } from "@/lib/pagination";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CuratorsListPanel } from "@/components/crm/curators-list-panel";
import { ListPagination } from "@/components/ui/list-pagination";

export const dynamic = "force-dynamic";

export default async function CrmCuratorsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);
  const page = parsePageParam(resolvedSearchParams.page);
  const q = resolvedSearchParams.q?.trim();

  const [result, statusCounts, summary] = await Promise.all([
    getCrmCuratorshipsListPaginated(ctx.shelterId, { page, q }),
    countCrmCuratorshipsByStatus(ctx.shelterId),
    getCuratorshipSummaryCounts(ctx.shelterId),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Куратори</h1>
          <p className="text-sm text-muted-foreground">
            {statusCounts.total} кураторств
            {statusCounts.activeCount > 0 && ` · ${statusCounts.activeCount} активних`}
            {statusCounts.pausedCount > 0 && ` · ${statusCounts.pausedCount} на паузі`}
          </p>
        </div>
        <Button asChild>
          <Link href={`/crm/${shelterSlug}/curators/new`}>+ Додати куратора</Link>
        </Button>
      </div>

      <CuratorsListPanel
        rows={result.items}
        shelterSlug={shelterSlug}
        locale={locale}
        searchQuery={q}
        totalCount={result.total}
        summary={summary}
      />

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        pathname={`/crm/${shelterSlug}/curators`}
        searchParams={{ q }}
      />
    </div>
  );
}
