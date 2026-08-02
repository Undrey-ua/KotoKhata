"use server";

import { revalidatePath } from "next/cache";
import { PaymentStatus, SponsorshipStatus, CuratorRelationshipStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requireShelterMember } from "@/lib/auth/session";

function revalidateAfterPaymentConfirm(
  shelterSlug: string,
  opts?: { animalSlug?: string; sponsorId?: string },
) {
  revalidatePath(`/crm/${shelterSlug}/payments`);
  revalidatePath(`/crm/${shelterSlug}/animals`);
  revalidatePath(`/crm/${shelterSlug}/curators`);
  revalidatePath(`/s/${shelterSlug}/cats`);
  revalidatePath("/uk");
  revalidatePath("/en");
  revalidatePath("/uk/my");
  revalidatePath("/en/my");

  if (opts?.animalSlug) {
    revalidatePath(`/s/${shelterSlug}/cats/${opts.animalSlug}`);
  }
  if (opts?.sponsorId) {
    revalidatePath(`/crm/${shelterSlug}/curators/${opts.sponsorId}`);
  }
}

export async function confirmPendingSponsorshipAction(
  shelterSlug: string,
  sponsorshipId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const sponsorship = await prisma.sponsorship.findFirst({
    where: {
      id: sponsorshipId,
      status: SponsorshipStatus.PENDING,
      animal: { shelterId: ctx.shelterId },
    },
    include: {
      animal: { select: { slug: true } },
    },
  });

  if (!sponsorship) {
    return { error: "Заявку не знайдено або вже підтверджено" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.sponsorship.update({
      where: { id: sponsorshipId },
      data: {
        status: SponsorshipStatus.ACTIVE,
        startedAt: new Date(),
      },
    });

    const pendingPayment = await tx.sponsorshipPayment.findFirst({
      where: { sponsorshipId, status: PaymentStatus.PENDING },
    });

    if (pendingPayment) {
      await tx.sponsorshipPayment.update({
        where: { id: pendingPayment.id },
        data: { status: PaymentStatus.COMPLETED, paidAt: new Date() },
      });
    } else {
      await tx.sponsorshipPayment.create({
        data: {
          sponsorshipId,
          amount: sponsorship.monthlyAmount,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });
    }
  });

  revalidateAfterPaymentConfirm(shelterSlug, {
    animalSlug: sponsorship.animal.slug,
    sponsorId: sponsorship.sponsorId,
  });

  return { success: true };
}

export async function confirmPendingDonationAction(
  shelterSlug: string,
  donationId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const donation = await prisma.donation.findFirst({
    where: {
      id: donationId,
      shelterId: ctx.shelterId,
      status: PaymentStatus.PENDING,
    },
  });

  if (!donation) {
    return { error: "Донат не знайдено або вже підтверджено" };
  }

  let animalSlug: string | undefined;
  if (donation.animalId) {
    const animal = await prisma.animal.findUnique({
      where: { id: donation.animalId },
      select: { slug: true },
    });
    animalSlug = animal?.slug;
  }

  await prisma.donation.update({
    where: { id: donationId },
    data: { status: PaymentStatus.COMPLETED },
  });

  revalidateAfterPaymentConfirm(shelterSlug, {
    animalSlug,
    sponsorId: donation.donorId ?? undefined,
  });

  return { success: true };
}

export async function confirmPendingSponsorshipPaymentAction(
  shelterSlug: string,
  paymentId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const payment = await prisma.sponsorshipPayment.findFirst({
    where: {
      id: paymentId,
      status: PaymentStatus.PENDING,
      sponsorship: { animal: { shelterId: ctx.shelterId } },
    },
    include: {
      sponsorship: {
        include: {
          animal: { select: { slug: true } },
        },
      },
    },
  });

  if (!payment) {
    return { error: "Платіж не знайдено або вже підтверджено" };
  }

  await prisma.sponsorshipPayment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.COMPLETED, paidAt: new Date() },
  });

  revalidateAfterPaymentConfirm(shelterSlug, {
    animalSlug: payment.sponsorship.animal.slug,
    sponsorId: payment.sponsorship.sponsorId,
  });

  return { success: true };
}

export async function rejectPendingDonationAction(
  shelterSlug: string,
  donationId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const updated = await prisma.donation.updateMany({
    where: {
      id: donationId,
      shelterId: ctx.shelterId,
      status: PaymentStatus.PENDING,
    },
    data: { status: PaymentStatus.FAILED },
  });

  if (updated.count === 0) {
    return { error: "Донат не знайдено" };
  }

  revalidateAfterPaymentConfirm(shelterSlug);
  return { success: true };
}

export async function rejectPendingSponsorshipAction(
  shelterSlug: string,
  sponsorshipId: string,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const updated = await prisma.sponsorship.updateMany({
    where: {
      id: sponsorshipId,
      status: SponsorshipStatus.PENDING,
      animal: { shelterId: ctx.shelterId },
    },
    data: {
      status: SponsorshipStatus.CANCELLED,
      curatorStatus: CuratorRelationshipStatus.ENDED,
      endedAt: new Date(),
    },
  });

  if (updated.count === 0) {
    return { error: "Заявку не знайдено" };
  }

  revalidateAfterPaymentConfirm(shelterSlug);
  return { success: true };
}
