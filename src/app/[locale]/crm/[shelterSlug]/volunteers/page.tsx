import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getShelterVolunteersPaginated } from "@/lib/crm/volunteers";
import { getPendingVolunteerAccessRequests } from "@/lib/crm/volunteer-access-requests";
import { parsePageParam } from "@/lib/pagination";
import { VolunteersPanel } from "@/components/crm/volunteers-panel";
import { VolunteerAccessRequestsPanel } from "@/components/crm/volunteer-access-requests-panel";
import { ListPagination } from "@/components/ui/list-pagination";

export const dynamic = "force-dynamic";

export default async function VolunteersPage({
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

  const [volunteers, pendingRequests] = await Promise.all([
    getShelterVolunteersPaginated(ctx.shelterId, { page }),
    ctx.isAdmin
      ? getPendingVolunteerAccessRequests(ctx.shelterId)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Волонтери</h1>
        <p className="mt-1 text-muted-foreground">
          Доступ до CRM та Telegram-бота · {volunteers.total} учасників
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
        members={volunteers.items}
        pendingInvites={volunteers.pendingInvites}
        totalCount={volunteers.total}
        isAdmin={ctx.isAdmin}
      />

      <ListPagination
        page={volunteers.page}
        totalPages={volunteers.totalPages}
        total={volunteers.total}
        pageSize={volunteers.pageSize}
        pathname={`/crm/${shelterSlug}/volunteers`}
      />
    </div>
  );
}
