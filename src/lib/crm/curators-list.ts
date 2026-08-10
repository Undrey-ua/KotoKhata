import {
  CuratorRelationshipStatus,
  PaymentStatus,
  SponsorshipStatus,
  type Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { displayCuratorName } from "@/lib/crm/curator-labels";
import {
  computeCuratorshipPaymentState,
  type CuratorshipPaymentState,
} from "@/lib/crm/curator-payment-status";
import { getCuratorNoteCountsBySponsor } from "@/lib/crm/curator-notes";
import {
  buildPaginationMeta,
  LIST_PAGE_SIZE,
  toPaginatedResult,
  type PaginatedResult,
} from "@/lib/pagination";
import { resolveMediaDisplayUrl } from "@/lib/serialize";

/** One row per curator–animal relationship (sponsorship). */
export type CrmCuratorshipRow = {
  sponsorshipId: string;
  curatorId: string;
  curatorName: string;
  email: string;
  phone: string | null;
  animalId: string;
  animalName: string;
  animalSlug: string;
  animalCoverUrl: string | null;
  monthlyAmount: number;
  curatorStatus: CuratorRelationshipStatus;
  workflowStatus: SponsorshipStatus;
  paymentState: CuratorshipPaymentState;
  noteCount: number;
  startedAt: Date;
};

/** @deprecated aggregated row — use CrmCuratorshipRow */
export type CrmCuratorWard = {
  sponsorshipId: string;
  animalId: string;
  animalName: string;
  animalSlug: string;
  monthlyAmount: number;
  status: SponsorshipStatus;
  curatorStatus: CuratorRelationshipStatus;
  startedAt: Date;
  paymentState: CuratorshipPaymentState;
};

/** @deprecated */
export type CrmCuratorRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  wards: CrmCuratorWard[];
  totalMonthly: number;
  activeWardCount: number;
  pendingWardCount: number;
  paymentCount: number;
  lastPaymentAt: Date | null;
  noteCount: number;
};

function lastCompletedPayment(
  payments: { paidAt: Date | null; createdAt: Date; status: PaymentStatus }[],
) {
  const completed = payments
    .filter((p) => p.status === PaymentStatus.COMPLETED)
    .map((p) => p.paidAt ?? p.createdAt)
    .sort((a, b) => b.getTime() - a.getTime());

  return completed[0] ?? null;
}

const curatorshipInclude = {
  sponsor: {
    select: {
      id: true,
      email: true,
      fullName: true,
      phone: true,
    },
  },
  animal: {
    select: {
      id: true,
      name: true,
      slug: true,
      media: {
        where: { type: "PHOTO" as const },
        orderBy: [{ isCover: "desc" as const }, { createdAt: "desc" as const }],
        take: 1,
        select: { id: true, publicUrl: true, isPublic: true },
      },
    },
  },
  payments: {
    select: { paidAt: true, createdAt: true, status: true },
    orderBy: { createdAt: "desc" as const },
  },
};

function buildCuratorshipWhere(
  shelterId: string,
  q?: string,
): Prisma.SponsorshipWhereInput {
  const base: Prisma.SponsorshipWhereInput = {
    animal: { shelterId },
    curatorStatus: { not: CuratorRelationshipStatus.ENDED },
    status: { not: SponsorshipStatus.CANCELLED },
  };

  if (!q?.trim()) return base;

  const term = q.trim();
  return {
    ...base,
    OR: [
      { sponsor: { fullName: { contains: term, mode: "insensitive" } } },
      { sponsor: { email: { contains: term, mode: "insensitive" } } },
      { sponsor: { phone: { contains: term, mode: "insensitive" } } },
      { animal: { name: { contains: term, mode: "insensitive" } } },
    ],
  };
}

function mapCuratorshipRow(
  s: {
    id: string;
    monthlyAmount: unknown;
    curatorStatus: CuratorRelationshipStatus;
    status: SponsorshipStatus;
    startedAt: Date;
    contributionIntervalDays: number;
    sponsor: {
      id: string;
      email: string;
      fullName: string | null;
      phone: string | null;
    };
    animal: {
      id: string;
      name: string;
      slug: string;
      media: Array<{ id: string; publicUrl: string | null; isPublic: boolean }>;
    };
    payments: Array<{ paidAt: Date | null; createdAt: Date; status: PaymentStatus }>;
  },
  notesBySponsor: Map<string, number>,
): CrmCuratorshipRow {
  const lastPaymentAt = lastCompletedPayment(s.payments);
  const paymentState = computeCuratorshipPaymentState({
    curatorStatus: s.curatorStatus,
    workflowStatus: s.status,
    lastPaymentAt,
    referenceDate: s.startedAt,
    contributionIntervalDays: s.contributionIntervalDays,
  });

  const cover = s.animal.media[0];

  return {
    sponsorshipId: s.id,
    curatorId: s.sponsor.id,
    curatorName: displayCuratorName(s.sponsor.fullName, s.sponsor.email),
    email: s.sponsor.email,
    phone: s.sponsor.phone,
    animalId: s.animal.id,
    animalName: s.animal.name,
    animalSlug: s.animal.slug,
    animalCoverUrl: cover ? resolveMediaDisplayUrl(cover) : null,
    monthlyAmount: Number(s.monthlyAmount),
    curatorStatus: s.curatorStatus,
    workflowStatus: s.status,
    paymentState,
    noteCount: notesBySponsor.get(s.sponsor.id) ?? 0,
    startedAt: s.startedAt,
  };
}

export async function countCrmCuratorshipsByStatus(shelterId: string) {
  const baseWhere = {
    animal: { shelterId },
    curatorStatus: { not: CuratorRelationshipStatus.ENDED },
    status: { not: SponsorshipStatus.CANCELLED },
  } as const;

  const [total, activeCount, pausedCount] = await Promise.all([
    prisma.sponsorship.count({ where: baseWhere }),
    prisma.sponsorship.count({
      where: { ...baseWhere, curatorStatus: CuratorRelationshipStatus.ACTIVE },
    }),
    prisma.sponsorship.count({
      where: { ...baseWhere, curatorStatus: CuratorRelationshipStatus.PAUSED },
    }),
  ]);

  return { activeCount, pausedCount, total };
}

export async function getCuratorshipSummaryCounts(shelterId: string) {
  const sponsorships = await prisma.sponsorship.findMany({
    where: buildCuratorshipWhere(shelterId),
    select: {
      curatorStatus: true,
      status: true,
      startedAt: true,
      contributionIntervalDays: true,
      payments: {
        where: { status: PaymentStatus.COMPLETED },
        select: { paidAt: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  let allGood = 0;
  let needReminder = 0;
  let needAttention = 0;

  for (const s of sponsorships) {
    if (s.curatorStatus !== CuratorRelationshipStatus.ACTIVE) continue;

    const lastPaymentAt = s.payments[0]?.paidAt ?? s.payments[0]?.createdAt ?? null;
    const state = computeCuratorshipPaymentState({
      curatorStatus: s.curatorStatus,
      workflowStatus: s.status,
      lastPaymentAt,
      referenceDate: s.startedAt,
      contributionIntervalDays: s.contributionIntervalDays,
    });

    if (state.recommendedAction === "NONE") allGood += 1;
    if (state.recommendedAction === "SEND_REMINDER") needReminder += 1;
    if (state.recommendedAction === "CONTACT_CURATOR") needAttention += 1;
  }

  return { allGood, needReminder, needAttention };
}

export async function getCrmCuratorshipsListPaginated(
  shelterId: string,
  options: { page?: number; pageSize?: number; q?: string } = {},
): Promise<PaginatedResult<CrmCuratorshipRow>> {
  const page = options.page ?? 1;
  const pageSize = options.pageSize ?? LIST_PAGE_SIZE;
  const where = buildCuratorshipWhere(shelterId, options.q);
  const meta = buildPaginationMeta(
    await prisma.sponsorship.count({ where }),
    page,
    pageSize,
  );

  const [sponsorships, notesBySponsor] = await Promise.all([
    prisma.sponsorship.findMany({
      where,
      include: curatorshipInclude,
      orderBy: { startedAt: "desc" },
      skip: meta.skip,
      take: meta.take,
    }),
    getCuratorNoteCountsBySponsor(shelterId),
  ]);

  return toPaginatedResult(
    sponsorships.map((s) => mapCuratorshipRow(s, notesBySponsor)),
    meta.total,
    meta.page,
    pageSize,
  );
}

export async function getCrmCuratorshipsList(
  shelterId: string,
): Promise<CrmCuratorshipRow[]> {
  const sponsorships = await prisma.sponsorship.findMany({
    where: buildCuratorshipWhere(shelterId),
    include: curatorshipInclude,
    orderBy: { startedAt: "desc" },
  });

  const notesBySponsor = await getCuratorNoteCountsBySponsor(shelterId);

  const rows = sponsorships.map((s) => mapCuratorshipRow(s, notesBySponsor));

  rows.sort((a, b) => {
    const actionOrder = (action: string) => {
      if (action === "CONTACT_CURATOR") return 0;
      if (action === "SEND_REMINDER") return 1;
      if (action === "AWAITING_CONFIRMATION") return 2;
      return 3;
    };
    const diff =
      actionOrder(a.paymentState.recommendedAction) -
      actionOrder(b.paymentState.recommendedAction);
    if (diff !== 0) return diff;
    return a.curatorName.localeCompare(b.curatorName, "uk");
  });

  return rows;
}

/** @deprecated use getCrmCuratorshipsList */
export async function getCrmCuratorsList(shelterId: string): Promise<CrmCuratorRow[]> {
  const rows = await getCrmCuratorshipsList(shelterId);
  const byUser = new Map<string, CrmCuratorRow>();

  for (const row of rows) {
    let agg = byUser.get(row.curatorId);
    if (!agg) {
      agg = {
        id: row.curatorId,
        name: row.curatorName,
        email: row.email,
        phone: row.phone,
        wards: [],
        totalMonthly: 0,
        activeWardCount: 0,
        pendingWardCount: 0,
        paymentCount: 0,
        lastPaymentAt: row.paymentState.lastPaymentAt,
        noteCount: row.noteCount,
      };
      byUser.set(row.curatorId, agg);
    }

    agg.wards.push({
      sponsorshipId: row.sponsorshipId,
      animalId: row.animalId,
      animalName: row.animalName,
      animalSlug: row.animalSlug,
      monthlyAmount: row.monthlyAmount,
      status: row.workflowStatus,
      curatorStatus: row.curatorStatus,
      startedAt: row.startedAt,
      paymentState: row.paymentState,
    });

    if (
      row.workflowStatus === SponsorshipStatus.ACTIVE &&
      row.curatorStatus === CuratorRelationshipStatus.ACTIVE
    ) {
      agg.totalMonthly += row.monthlyAmount;
      agg.activeWardCount += 1;
    }
    if (row.workflowStatus === SponsorshipStatus.PENDING) {
      agg.pendingWardCount += 1;
    }
    if (
      row.paymentState.lastPaymentAt &&
      (!agg.lastPaymentAt || row.paymentState.lastPaymentAt > agg.lastPaymentAt)
    ) {
      agg.lastPaymentAt = row.paymentState.lastPaymentAt;
    }
  }

  return Array.from(byUser.values());
}
