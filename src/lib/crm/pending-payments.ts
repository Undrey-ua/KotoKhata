import { PaymentStatus, SponsorshipStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { displayCuratorName } from "@/lib/crm/curator-labels";

export type PendingCuratorshipItem = {
  kind: "curatorship";
  id: string;
  createdAt: Date;
  amount: number;
  curatorId: string;
  curatorName: string;
  curatorEmail: string;
  animalName: string;
  animalSlug: string;
  message: string | null;
};

export type PendingDonationItem = {
  kind: "donation";
  id: string;
  createdAt: Date;
  amount: number;
  donorName: string | null;
  donorEmail: string | null;
  animalName: string | null;
  animalSlug: string | null;
  message: string | null;
};

export type PendingSponsorshipPaymentItem = {
  kind: "sponsorship_payment";
  id: string;
  createdAt: Date;
  amount: number;
  curatorId: string;
  curatorName: string;
  animalName: string;
  animalSlug: string;
};

export type PendingPaymentItem =
  | PendingCuratorshipItem
  | PendingDonationItem
  | PendingSponsorshipPaymentItem;

export async function getPendingPayments(shelterId: string): Promise<PendingPaymentItem[]> {
  const [sponsorships, donations, sponsorshipPayments] = await Promise.all([
    prisma.sponsorship.findMany({
      where: {
        status: SponsorshipStatus.PENDING,
        animal: { shelterId },
      },
      include: {
        sponsor: { select: { id: true, fullName: true, email: true } },
        animal: { select: { name: true, slug: true } },
      },
      orderBy: { startedAt: "desc" },
    }),
    prisma.donation.findMany({
      where: { shelterId, status: PaymentStatus.PENDING },
      include: {
        donor: { select: { fullName: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sponsorshipPayment.findMany({
      where: {
        status: PaymentStatus.PENDING,
        sponsorship: { animal: { shelterId } },
      },
      include: {
        sponsorship: {
          include: {
            sponsor: { select: { id: true, fullName: true, email: true } },
            animal: { select: { name: true, slug: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const donationAnimalIds = donations
    .map((d) => d.animalId)
    .filter((id): id is string => id != null);
  const donationAnimals =
    donationAnimalIds.length > 0
      ? await prisma.animal.findMany({
          where: { id: { in: donationAnimalIds } },
          select: { id: true, name: true, slug: true },
        })
      : [];
  const animalById = new Map(donationAnimals.map((a) => [a.id, a]));

  const curatorships: PendingCuratorshipItem[] = sponsorships.map((s) => ({
    kind: "curatorship",
    id: s.id,
    createdAt: s.startedAt,
    amount: Number(s.monthlyAmount),
    curatorId: s.sponsor.id,
    curatorName: displayCuratorName(s.sponsor.fullName, s.sponsor.email),
    curatorEmail: s.sponsor.email,
    animalName: s.animal.name,
    animalSlug: s.animal.slug,
    message: s.message,
  }));

  const donationItems: PendingDonationItem[] = donations.map((d) => {
    const animal = d.animalId ? animalById.get(d.animalId) : null;
    return {
      kind: "donation",
      id: d.id,
      createdAt: d.createdAt,
      amount: Number(d.amount),
      donorName: d.donor?.fullName ?? null,
      donorEmail: d.donor?.email ?? null,
      animalName: animal?.name ?? null,
      animalSlug: animal?.slug ?? null,
      message: d.message,
    };
  });

  const paymentItems: PendingSponsorshipPaymentItem[] = sponsorshipPayments.map((p) => ({
    kind: "sponsorship_payment",
    id: p.id,
    createdAt: p.createdAt,
    amount: Number(p.amount),
    curatorId: p.sponsorship.sponsor.id,
    curatorName: displayCuratorName(
      p.sponsorship.sponsor.fullName,
      p.sponsorship.sponsor.email,
    ),
    animalName: p.sponsorship.animal.name,
    animalSlug: p.sponsorship.animal.slug,
  }));

  return [...curatorships, ...donationItems, ...paymentItems].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

export async function getPendingPaymentsCount(shelterId: string) {
  const [curatorships, donations, payments] = await Promise.all([
    prisma.sponsorship.count({
      where: { status: SponsorshipStatus.PENDING, animal: { shelterId } },
    }),
    prisma.donation.count({
      where: { shelterId, status: PaymentStatus.PENDING },
    }),
    prisma.sponsorshipPayment.count({
      where: {
        status: PaymentStatus.PENDING,
        sponsorship: { animal: { shelterId } },
      },
    }),
  ]);
  return curatorships + donations + payments;
}
