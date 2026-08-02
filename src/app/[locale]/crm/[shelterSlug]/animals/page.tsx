import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getCrmAnimalsList } from "@/lib/crm/animals-list";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AnimalsListPanel } from "@/components/crm/animals-list-panel";

export const dynamic = "force-dynamic";

export default async function CrmAnimalsPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const rows = await getCrmAnimalsList(ctx.shelterId);
  const withCurators = rows.filter((r) => r.funding.hasCurators).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Котики</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} записів
            {withCurators > 0 && ` · ${withCurators} під кураторством`}
          </p>
        </div>
        <Button asChild>
          <Link href={`/crm/${shelterSlug}/animals/new`}>+ Додати</Link>
        </Button>
      </div>

      <AnimalsListPanel rows={rows} shelterSlug={shelterSlug} />
    </div>
  );
}
