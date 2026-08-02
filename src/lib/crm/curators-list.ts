import {
  CuratorRelationshipStatus,
  PaymentStatus,
  SponsorshipStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { displayCuratorName } from "@/lib/crm/curator-labels";
import {
  computeCuratorshipPaymentState,
  type CuratorshipPaymentState,
} from "@/lib/crm/curator-payment-status";
import { getCuratorNoteCountsBySponsor } from "@/lib/crm/curator-notes";

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

export async function getCrmCuratorshipsList(
  shelterId: string,
): Promise<CrmCuratorshipRow[]> {
  const sponsorships = await prisma.sponsorship.findMany({
    where: {
      animal: { shelterId },
      curatorStatus: { not: CuratorRelationshipStatus.ENDED },
      status: { not: SponsorshipStatus.CANCELLED },
    },
    include: {
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
            where: { type: "PHOTO" },
            orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
            take: 1,
            select: { id: true },
          },
        },
      },
      payments: {
        select: { paidAt: true, createdAt: true, status: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { startedAt: "desc" },
  });

  const notesBySponsor = await getCuratorNoteCountsBySponsor(shelterId);

  const rows: CrmCuratorshipRow[] = sponsorships.map((s) => {
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
      animalCoverUrl: cover ? `/api/media/${cover.id}` : null,
      monthlyAmount: Number(s.monthlyAmount),
      curatorStatus: s.curatorStatus,
      workflowStatus: s.status,
      paymentState,
      noteCount: notesBySponsor.get(s.sponsor.id) ?? 0,
      startedAt: s.startedAt,
    };
  });

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
