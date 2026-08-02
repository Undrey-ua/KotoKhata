"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { PaymentStatus, SponsorshipStatus, CuratorRelationshipStatus } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireShelterMember } from "@/lib/auth/session";
import { curatorNotesAvailable } from "@/lib/crm/curator-notes";
import { parseCreateCuratorForm } from "@/lib/validations/curator";

const noteSchema = z.object({
  content: z.string().min(1, "Коментар не може бути порожнім").max(2000),
});

function revalidateCuratorPaths(
  shelterSlug: string,
  opts?: { sponsorId?: string; animalSlug?: string },
) {
  revalidatePath(`/crm/${shelterSlug}/curators`);
  revalidatePath(`/crm/${shelterSlug}/animals`);
  revalidatePath(`/crm/${shelterSlug}/payments`);
  revalidatePath(`/s/${shelterSlug}/cats`);
  if (opts?.sponsorId) {
    revalidatePath(`/crm/${shelterSlug}/curators/${opts.sponsorId}`);
  }
  if (opts?.animalSlug) {
    revalidatePath(`/s/${shelterSlug}/cats/${opts.animalSlug}`);
  }
}

export async function createCuratorAction(
  shelterSlug: string,
  _prevState: { error?: string } | null,
  formData: FormData,
) {
  const ctx = await requireShelterMember(shelterSlug);
  let sponsorId: string | undefined;

  try {
    const data = parseCreateCuratorForm(formData);
    const email = data.email.toLowerCase();

    const animal = await prisma.animal.findFirst({
      where: { id: data.animalId, shelterId: ctx.shelterId },
      select: { id: true, slug: true, minCuratorshipAmount: true },
    });

    if (!animal) {
      return { error: "Котика не знайдено" };
    }

    const minAmount = animal.minCuratorshipAmount
      ? Number(animal.minCuratorshipAmount)
      : null;
    if (minAmount != null && data.monthlyAmount < minAmount) {
      return { error: `Мінімальна сума кураторства — ${minAmount} ₴/міс` };
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: randomUUID(),
          email,
          fullName: data.fullName,
          phone: data.phone ?? null,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          fullName: data.fullName,
          phone: data.phone ?? undefined,
        },
      });
    }

    const existing = await prisma.sponsorship.findUnique({
      where: {
        animalId_sponsorId: { animalId: animal.id, sponsorId: user.id },
      },
    });

    if (existing && existing.status !== SponsorshipStatus.CANCELLED) {
      return { error: "Цей куратор вже прив'язаний до обраного котика" };
    }

    const sponsorship = existing
      ? await prisma.sponsorship.update({
          where: { id: existing.id },
          data: {
            status: data.status,
            monthlyAmount: data.monthlyAmount,
            message: data.message,
            startedAt: new Date(),
            endedAt: null,
          },
        })
      : await prisma.sponsorship.create({
          data: {
            animalId: animal.id,
            sponsorId: user.id,
            status: data.status,
            curatorStatus: CuratorRelationshipStatus.ACTIVE,
            monthlyAmount: data.monthlyAmount,
            message: data.message,
          },
        });

    if (data.status === SponsorshipStatus.ACTIVE) {
      await prisma.sponsorshipPayment.create({
        data: {
          sponsorshipId: sponsorship.id,
          amount: data.monthlyAmount,
          status: PaymentStatus.COMPLETED,
          paidAt: new Date(),
        },
      });
    }

    revalidateCuratorPaths(shelterSlug, {
      sponsorId: user.id,
      animalSlug: animal.slug,
    });

    sponsorId = user.id;
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return {
      error: e instanceof Error ? e.message : "Не вдалося додати куратора",
    };
  }

  redirect(`/uk/crm/${shelterSlug}/curators/${sponsorId}`);
}

export async function updateCuratorStatusAction(
  shelterSlug: string,
  sponsorshipId: string,
  curatorStatus: CuratorRelationshipStatus,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const updated = await prisma.sponsorship.updateMany({
    where: {
      id: sponsorshipId,
      animal: { shelterId: ctx.shelterId },
    },
    data: {
      curatorStatus,
      ...(curatorStatus === CuratorRelationshipStatus.ENDED
        ? { endedAt: new Date() }
        : { endedAt: null }),
    },
  });

  if (updated.count === 0) {
    return { error: "Кураторство не знайдено" };
  }

  const sponsorship = await prisma.sponsorship.findUnique({
    where: { id: sponsorshipId },
    select: { sponsorId: true, animal: { select: { slug: true } } },
  });

  revalidateCuratorPaths(shelterSlug, {
    sponsorId: sponsorship?.sponsorId,
    animalSlug: sponsorship?.animal.slug,
  });

  return { success: true };
}

export async function addCuratorNoteAction(
  shelterSlug: string,
  sponsorId: string,
  _prev: { error?: string } | null,
  formData: FormData,
) {
  const ctx = await requireShelterMember(shelterSlug);

  const parsed = noteSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Невірні дані" };
  }

  const hasSponsorship = await prisma.sponsorship.findFirst({
    where: {
      sponsorId,
      animal: { shelterId: ctx.shelterId },
    },
    select: { id: true },
  });

  if (!hasSponsorship) {
    return { error: "Куратора не знайдено" };
  }

  if (!curatorNotesAvailable()) {
    return {
      error: "Коментарі ще недоступні. Застосуйте міграції: npx prisma migrate deploy",
    };
  }

  await prisma.curatorNote.create({
    data: {
      shelterId: ctx.shelterId,
      sponsorId,
      authorId: ctx.userId,
      content: parsed.data.content,
    },
  });

  revalidatePath(`/crm/${shelterSlug}/curators`);
  revalidatePath(`/crm/${shelterSlug}/curators/${sponsorId}`);

  return null;
}
