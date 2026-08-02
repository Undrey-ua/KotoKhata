import { SponsorshipStatus, type AnimalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeFundingInfo, type AnimalFundingInfo } from "@/lib/animal-funding";

export type CrmAnimalCurator = {
  id: string;
  name: string;
  monthlyAmount: number;
  status: SponsorshipStatus;
};

export type CrmAnimalRow = {
  id: string;
  name: string;
  slug: string;
  status: AnimalStatus;
  isPublic: boolean;
  isFeatured: boolean;
  coverUrl: string | null;
  funding: AnimalFundingInfo;
  curators: CrmAnimalCurator[];
  pendingCount: number;
};

function curatorName(fullName: string | null, email: string) {
  return fullName?.trim() || email.split("@")[0];
}

export async function getCrmAnimalsList(shelterId: string): Promise<CrmAnimalRow[]> {
  const animals = await prisma.animal.findMany({
    where: { shelterId },
    include: {
      media: {
        where: { type: "PHOTO" },
        orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
        take: 1,
      },
      sponsorships: {
        where: {
          status: { in: [SponsorshipStatus.ACTIVE, SponsorshipStatus.PENDING] },
        },
        include: {
          sponsor: { select: { fullName: true, email: true } },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  const rows: CrmAnimalRow[] = animals.map((animal) => {
    const activeSponsorships = animal.sponsorships.filter(
      (s) => s.status === SponsorshipStatus.ACTIVE,
    );
    const pendingSponsorships = animal.sponsorships.filter(
      (s) => s.status === SponsorshipStatus.PENDING,
    );

    const fundedMonthly = activeSponsorships.reduce(
      (sum, s) => sum + Number(s.monthlyAmount),
      0,
    );

    const cover = animal.media[0];

    return {
      id: animal.id,
      name: animal.name,
      slug: animal.slug,
      status: animal.status,
      isPublic: animal.isPublic,
      isFeatured: animal.isFeatured,
      coverUrl: cover ? `/api/media/${cover.id}` : null,
      funding: computeFundingInfo(
        animal.monthlyGoal,
        animal.minCuratorshipAmount,
        fundedMonthly,
      ),
      curators: activeSponsorships.map((s) => ({
        id: s.id,
        name: curatorName(s.sponsor.fullName, s.sponsor.email),
        monthlyAmount: Number(s.monthlyAmount),
        status: s.status,
      })),
      pendingCount: pendingSponsorships.length,
    };
  });

  rows.sort((a, b) => {
    if (a.funding.hasCurators !== b.funding.hasCurators) {
      return a.funding.hasCurators ? -1 : 1;
    }
    const aPct = a.funding.fundedPercent ?? 0;
    const bPct = b.funding.fundedPercent ?? 0;
    if (aPct !== bPct) return bPct - aPct;
    return a.name.localeCompare(b.name, "uk");
  });

  return rows;
}
