import { SponsorshipStatus, type AnimalStatus, type Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { computeFundingInfo, type AnimalFundingInfo } from "@/lib/animal-funding";
import {
  buildPaginationMeta,
  LIST_PAGE_SIZE,
  toPaginatedResult,
  type PaginatedResult,
} from "@/lib/pagination";
import { resolveMediaDisplayUrl } from "@/lib/serialize";

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

function buildAnimalSearchWhere(
  shelterId: string,
  q?: string,
): Prisma.AnimalWhereInput {
  if (!q?.trim()) {
    return { shelterId };
  }

  const term = q.trim();
  return {
    shelterId,
    OR: [
      { name: { contains: term, mode: "insensitive" } },
      { slug: { contains: term, mode: "insensitive" } },
      {
        sponsorships: {
          some: {
            status: { in: [SponsorshipStatus.ACTIVE, SponsorshipStatus.PENDING] },
            sponsor: {
              OR: [
                { fullName: { contains: term, mode: "insensitive" } },
                { email: { contains: term, mode: "insensitive" } },
              ],
            },
          },
        },
      },
    ],
  };
}

function mapAnimalRow(
  animal: Prisma.AnimalGetPayload<{
    include: {
      media: true;
      sponsorships: { include: { sponsor: { select: { fullName: true; email: true } } } };
    };
  }>,
): CrmAnimalRow {
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
    coverUrl: cover ? resolveMediaDisplayUrl(cover) : null,
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
}

export async function countCrmAnimalsWithCurators(shelterId: string) {
  return prisma.animal.count({
    where: {
      shelterId,
      sponsorships: { some: { status: SponsorshipStatus.ACTIVE } },
    },
  });
}

export async function getCrmAnimalsListPaginated(
  shelterId: string,
  options: { page?: number; pageSize?: number; q?: string } = {},
): Promise<PaginatedResult<CrmAnimalRow>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? LIST_PAGE_SIZE;
  const where = buildAnimalSearchWhere(shelterId, options.q);
  const meta = buildPaginationMeta(
    await prisma.animal.count({ where }),
    page,
    pageSize,
  );

  const animals = await prisma.animal.findMany({
    where,
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
    orderBy: { name: "asc" },
    skip: meta.skip,
    take: meta.take,
  });

  return toPaginatedResult(
    animals.map(mapAnimalRow),
    meta.total,
    meta.page,
    pageSize,
  );
}

export async function getCrmAnimalsList(shelterId: string): Promise<CrmAnimalRow[]> {
  const result = await getCrmAnimalsListPaginated(shelterId, {
    page: 1,
    pageSize: 10_000,
  });
  return result.items;
}
