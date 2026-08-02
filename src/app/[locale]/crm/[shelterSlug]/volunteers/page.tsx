import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getShelterVolunteers } from "@/lib/crm/volunteers";
import { VolunteersPanel } from "@/components/crm/volunteers-panel";

export const dynamic = "force-dynamic";

export default async function VolunteersPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);
  const volunteers = await getShelterVolunteers(ctx.shelterId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Волонтери</h1>
        <p className="mt-1 text-muted-foreground">
          Доступ до CRM та Telegram-бота
        </p>
      </div>

      <VolunteersPanel
        shelterSlug={shelterSlug}
        volunteers={volunteers}
        isAdmin={ctx.isAdmin}
      />
    </div>
  );
}
