import { randomUUID } from "crypto";
import {
  CuratorRelationshipStatus,
  PaymentStatus,
  SponsorshipStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export type CreateCuratorFromTelegramInput = {
  shelterId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  animalId: string;
  monthlyAmount: number;
};

export async function createCuratorFromTelegram(
  input: CreateCuratorFromTelegramInput,
) {
  const email = input.email.trim().toLowerCase();
  const fullName = input.fullName.trim();
  const phone = input.phone?.trim() || null;

  const animal = await prisma.animal.findFirst({
    where: { id: input.animalId, shelterId: input.shelterId },
    select: { id: true, slug: true, name: true, minCuratorshipAmount: true },
  });

  if (!animal) {
    throw new Error("Котика не знайдено");
  }

  const minAmount = animal.minCuratorshipAmount
    ? Number(animal.minCuratorshipAmount)
    : null;

  if (minAmount != null && input.monthlyAmount < minAmount) {
    throw new Error(`Мінімальна сума кураторства — ${minAmount} ₴/міс`);
  }

  let user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    user = await prisma.user.create({
      data: {
        id: randomUUID(),
        email,
        fullName,
        phone,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { fullName, phone: phone ?? undefined },
    });
  }

  const existing = await prisma.sponsorship.findUnique({
    where: {
      animalId_sponsorId: { animalId: animal.id, sponsorId: user.id },
    },
  });

  if (existing && existing.status !== SponsorshipStatus.CANCELLED) {
    throw new Error("Цей куратор вже прив'язаний до обраного котика");
  }

  const sponsorship = existing
    ? await prisma.sponsorship.update({
        where: { id: existing.id },
        data: {
          status: SponsorshipStatus.ACTIVE,
          curatorStatus: CuratorRelationshipStatus.ACTIVE,
          monthlyAmount: input.monthlyAmount,
          startedAt: new Date(),
          endedAt: null,
        },
      })
    : await prisma.sponsorship.create({
        data: {
          animalId: animal.id,
          sponsorId: user.id,
          status: SponsorshipStatus.ACTIVE,
          curatorStatus: CuratorRelationshipStatus.ACTIVE,
          monthlyAmount: input.monthlyAmount,
        },
      });

  await prisma.sponsorshipPayment.create({
    data: {
      sponsorshipId: sponsorship.id,
      amount: input.monthlyAmount,
      status: PaymentStatus.COMPLETED,
      paidAt: new Date(),
    },
  });

  return {
    curatorName: fullName,
    animalName: animal.name,
    monthlyAmount: input.monthlyAmount,
    sponsorId: user.id,
    animalSlug: animal.slug,
  };
}
