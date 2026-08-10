import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getPendingPaymentsPaginated } from "@/lib/crm/pending-payments";
import { parsePageParam } from "@/lib/pagination";
import { PendingPaymentsTable } from "@/components/crm/pending-payments-table";
import { ListPagination } from "@/components/ui/list-pagination";

export const dynamic = "force-dynamic";

export default async function CrmPaymentsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);
  const page = parsePageParam(resolvedSearchParams.page);
  const result = await getPendingPaymentsPaginated(ctx.shelterId, { page });

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Фінанси</h1>
        <p className="text-sm text-muted-foreground">
          {result.total === 0
            ? "Усі платежі підтверджено"
            : `${result.total} очікують підтвердження`}
        </p>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Після отримання переказу на рахунок натисніть «Підтвердити» — кураторство стане
        активним, а прогрес забезпечення оновиться на сайті.
      </p>

      <PendingPaymentsTable items={result.items} shelterSlug={shelterSlug} locale={locale} />

      <ListPagination
        page={result.page}
        totalPages={result.totalPages}
        total={result.total}
        pageSize={result.pageSize}
        pathname={`/crm/${shelterSlug}/payments`}
      />
    </div>
  );
}
