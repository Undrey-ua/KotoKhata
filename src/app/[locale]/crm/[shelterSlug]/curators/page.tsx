import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getCrmCuratorshipsList } from "@/lib/crm/curators-list";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { CuratorsListPanel } from "@/components/crm/curators-list-panel";
import { CuratorRelationshipStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function CrmCuratorsPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const rows = await getCrmCuratorshipsList(ctx.shelterId);
  const activeCount = rows.filter((r) => r.curatorStatus === CuratorRelationshipStatus.ACTIVE).length;
  const pausedCount = rows.filter((r) => r.curatorStatus === CuratorRelationshipStatus.PAUSED).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Куратори</h1>
          <p className="text-sm text-muted-foreground">
            {rows.length} кураторств
            {activeCount > 0 && ` · ${activeCount} активних`}
            {pausedCount > 0 && ` · ${pausedCount} на паузі`}
          </p>
        </div>
        <Button asChild>
          <Link href={`/crm/${shelterSlug}/curators/new`}>+ Додати куратора</Link>
        </Button>
      </div>

      <CuratorsListPanel rows={rows} shelterSlug={shelterSlug} locale={locale} />
    </div>
  );
}
