import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getPendingPayments } from "@/lib/crm/pending-payments";
import { PendingPaymentsTable } from "@/components/crm/pending-payments-table";

export const dynamic = "force-dynamic";

export default async function CrmPaymentsPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const items = await getPendingPayments(ctx.shelterId);
  const curatorshipCount = items.filter((i) => i.kind === "curatorship").length;
  const donationCount = items.filter((i) => i.kind === "donation").length;

  return (
    <div>
      <div>
        <h1 className="text-2xl font-bold text-foreground">Фінанси</h1>
        <p className="text-sm text-muted-foreground">
          {items.length === 0
            ? "Усі платежі підтверджено"
            : `${items.length} очікують підтвердження · ${curatorshipCount} кураторств · ${donationCount} донатів`}
        </p>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        Після отримання переказу на рахунок натисніть «Підтвердити» — кураторство стане
        активним, а прогрес забезпечення оновиться на сайті.
      </p>

      <PendingPaymentsTable items={items} shelterSlug={shelterSlug} locale={locale} />
    </div>
  );
}
