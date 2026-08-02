import { CuratorRelationshipStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  displayCuratorName,
  donationTypeLabel,
  type PaymentHistoryItem,
} from "@/lib/crm/curator-labels";
import type { CrmCuratorWard } from "@/lib/crm/curators-list";
import { computeCuratorshipPaymentState } from "@/lib/crm/curator-payment-status";
import { listCuratorNotes } from "@/lib/crm/curator-notes";

export type CrmCuratorNote = {
  id: string;
  content: string;
  createdAt: Date;
  authorName: string;
};

export type CrmCuratorDetail = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  locale: string;
  memberSince: Date;
  wards: CrmCuratorWard[];
  payments: PaymentHistoryItem[];
  notes: CrmCuratorNote[];
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

export async function getCrmCuratorDetail(
  shelterId: string,
  sponsorId: string,
): Promise<CrmCuratorDetail | null> {
  const [sponsor, sponsorships, donations, notes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: sponsorId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phone: true,
        locale: true,
        createdAt: true,
      },
    }),
    prisma.sponsorship.findMany({
      where: {
        sponsorId,
        animal: { shelterId },
        curatorStatus: { not: CuratorRelationshipStatus.ENDED },
      },
      include: {
        animal: { select: { id: true, name: true, slug: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.donation.findMany({
      where: { shelterId, donorId: sponsorId },
      orderBy: { createdAt: "desc" },
    }),
    listCuratorNotes(shelterId, sponsorId),
  ]);

  if (!sponsor || sponsorships.length === 0) {
    return null;
  }

  const donationAnimalIds = donations
    .map((d) => d.animalId)
    .filter((id): id is string => id != null);
  const donationAnimals =
    donationAnimalIds.length > 0
      ? await prisma.animal.findMany({
          where: { id: { in: donationAnimalIds } },
          select: { id: true, name: true },
        })
      : [];
  const animalNameById = new Map(donationAnimals.map((a) => [a.id, a.name]));

  const wards: CrmCuratorWard[] = sponsorships.map((s) => {
    const lastPaymentAt = lastCompletedPayment(s.payments);
    return {
      sponsorshipId: s.id,
      animalId: s.animal.id,
      animalName: s.animal.name,
      animalSlug: s.animal.slug,
      monthlyAmount: Number(s.monthlyAmount),
      status: s.status,
      curatorStatus: s.curatorStatus,
      startedAt: s.startedAt,
      paymentState: computeCuratorshipPaymentState({
        curatorStatus: s.curatorStatus,
        workflowStatus: s.status,
        lastPaymentAt,
        referenceDate: s.startedAt,
        contributionIntervalDays: s.contributionIntervalDays,
      }),
    };
  });

  const sponsorshipPayments: PaymentHistoryItem[] = sponsorships.flatMap((s) =>
    s.payments.map((p) => ({
      id: p.id,
      date: p.paidAt ?? p.createdAt,
      amount: Number(p.amount),
      kind: "monthly" as const,
      kindLabel: "Кураторство",
      animalName: s.animal.name,
      status: p.status,
    })),
  );

  const donationPayments: PaymentHistoryItem[] = donations.map((d) => ({
    id: d.id,
    date: d.createdAt,
    amount: Number(d.amount),
    kind: "one_time" as const,
    kindLabel: donationTypeLabel(d.type),
    animalName: d.animalId ? (animalNameById.get(d.animalId) ?? null) : null,
    status: d.status,
  }));

  const payments = [...sponsorshipPayments, ...donationPayments].sort(
    (a, b) => b.date.getTime() - a.date.getTime(),
  );

  return {
    id: sponsor.id,
    name: displayCuratorName(sponsor.fullName, sponsor.email),
    email: sponsor.email,
    phone: sponsor.phone,
    locale: sponsor.locale,
    memberSince: sponsor.createdAt,
    wards,
    payments,
    notes: notes.map((note) => ({
      id: note.id,
      content: note.content,
      createdAt: note.createdAt,
      authorName: displayCuratorName(note.author.fullName, note.author.email),
    })),
  };
}
