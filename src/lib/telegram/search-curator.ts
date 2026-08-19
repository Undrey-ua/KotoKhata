import {
  CuratorRelationshipStatus,
  SponsorshipStatus,
} from "@prisma/client";
import { displayCuratorName } from "@/lib/crm/curator-labels";
import { getCrmCuratorshipsListPaginated } from "@/lib/crm/curators-list";
import { prisma } from "@/lib/db/prisma";

export type ShelterCuratorSearchHit = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
};

export async function searchShelterCuratorsByQuery(
  shelterId: string,
  query: string,
  limit = 8,
): Promise<ShelterCuratorSearchHit[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const result = await getCrmCuratorshipsListPaginated(shelterId, {
    q: trimmed,
    page: 1,
    pageSize: Math.max(limit, 20),
  });

  const byId = new Map<string, ShelterCuratorSearchHit>();

  for (const row of result.items) {
    if (byId.has(row.curatorId)) continue;

    byId.set(row.curatorId, {
      id: row.curatorId,
      name: row.curatorName,
      email: row.email,
      phone: row.phone,
    });

    if (byId.size >= limit) break;
  }

  return [...byId.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "uk"),
  );
}

export async function getShelterCuratorById(
  shelterId: string,
  sponsorId: string,
): Promise<ShelterCuratorSearchHit | null> {
  const sponsorship = await prisma.sponsorship.findFirst({
    where: {
      sponsorId,
      animal: { shelterId },
      curatorStatus: { not: CuratorRelationshipStatus.ENDED },
      status: { not: SponsorshipStatus.CANCELLED },
    },
    include: {
      sponsor: {
        select: { id: true, fullName: true, email: true, phone: true },
      },
    },
  });

  if (!sponsorship) return null;

  return {
    id: sponsorship.sponsor.id,
    name: displayCuratorName(
      sponsorship.sponsor.fullName,
      sponsorship.sponsor.email,
    ),
    email: sponsorship.sponsor.email,
    phone: sponsorship.sponsor.phone,
  };
}
