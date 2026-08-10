import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getShelterVolunteers } from "@/lib/crm/volunteers";
import { getPendingVolunteerAccessRequests } from "@/lib/crm/volunteer-access-requests";
import { VolunteersPanel } from "@/components/crm/volunteers-panel";
import { VolunteerAccessRequestsPanel } from "@/components/crm/volunteer-access-requests-panel";

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
  const pendingRequests = ctx.isAdmin
    ? await getPendingVolunteerAccessRequests(ctx.shelterId)
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Волонтери</h1>
        <p className="mt-1 text-muted-foreground">
          Доступ до CRM та Telegram-бота
        </p>
      </div>

      {ctx.isAdmin && pendingRequests.length > 0 ? (
        <VolunteerAccessRequestsPanel
          shelterSlug={shelterSlug}
          requests={pendingRequests}
        />
      ) : null}

      <VolunteersPanel
        shelterSlug={shelterSlug}
        volunteers={volunteers}
        isAdmin={ctx.isAdmin}
      />
    </div>
  );
}
