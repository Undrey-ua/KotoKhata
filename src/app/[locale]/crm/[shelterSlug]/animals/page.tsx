import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import {
  countCrmAnimalsWithCurators,
  getCrmAnimalsListPaginated,
} from "@/lib/crm/animals-list";
import { parsePageParam } from "@/lib/pagination";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AnimalsListPanel } from "@/components/crm/animals-list-panel";
import { ListPagination } from "@/components/ui/list-pagination";

export const dynamic = "force-dynamic";

export default async function CrmAnimalsPage({
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

  const [result, withCurators] = await Promise.all([
    getCrmAnimalsListPaginated(ctx.shelterId, { page, q }),
    countCrmAnimalsWithCurators(ctx.shelterId),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Котики</h1>
          <p className="text-sm text-muted-foreground">
            {result.total} записів
            {withCurators > 0 && ` · ${withCurators} під кураторством`}
          </p>
        </div>
        <Button asChild>
          <Link href={`/crm/${shelterSlug}/animals/new`}>+ Додати</Link>
        </Button>
      </div>

      <AnimalsListPanel
        rows={result.items}
        shelterSlug={shelterSlug}
        searchQuery={q}
        totalCount={result.total}
      />

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        pathname={`/crm/${shelterSlug}/animals`}
        searchParams={{ q }}
      />
    </div>
  );
}
