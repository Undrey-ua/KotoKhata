"use server";

import { DonationType, PaymentStatus, SponsorshipStatus } from "@prisma/client";
import { createClient } from "@/lib/auth/supabase-server";
import { getAppSession } from "@/lib/auth/session";
import { syncUserFromAuth } from "@/lib/auth/sync-user";
import { prisma } from "@/lib/db/prisma";
import { decimalToNumber } from "@/lib/animal-funding";
import {
  donateFormSchema,
  sponsorFormSchema,
} from "@/lib/validations/payment";

export type PaymentRequisitesResult = {
  iban: string;
  recipient: string;
  bankName: string | null;
  amount: number;
  purpose: string;
  referenceId: string;
};

export type PaymentActionResult =
  | { ok: true; requisites: PaymentRequisitesResult; needsEmailConfirm?: boolean }
  | { ok: false; error: string };

function buildRequisites(
  shelter: {
    bankIban: string | null;
    bankRecipient: string | null;
    bankName: string | null;
  },
  amount: number,
  purpose: string,
  referenceId: string,
): PaymentRequisitesResult | { error: string } {
  if (!shelter.bankIban || !shelter.bankRecipient) {
    return { error: "Реквізити притулку ще не налаштовані. Зверніться до адміністратора." };
  }

  return {
    iban: shelter.bankIban,
    recipient: shelter.bankRecipient,
    bankName: shelter.bankName,
    amount,
    purpose,
    referenceId,
  };
}

async function resolveSponsorUser(formData: FormData) {
  const session = await getAppSession();
  if (session) {
    return { userId: session.appUser.id, needsEmailConfirm: false };
  }

  const parsed = sponsorFormSchema.pick({
    fullName: true,
    email: true,
    password: true,
  }).safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    throw new Error("Заповніть ім'я, email та пароль для реєстрації");
  }

  const { fullName, email, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email!,
    password: password!,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error("Не вдалося створити акаунт");
  }

  await syncUserFromAuth(data.user);

  return {
    userId: data.user.id,
    needsEmailConfirm: !data.session,
  };
}

export async function submitDonationAction(
  shelterSlug: string,
  animalSlug: string,
  _prev: PaymentActionResult | null,
  formData: FormData,
): Promise<PaymentActionResult> {
  try {
    const session = await getAppSession();
    const parsed = donateFormSchema.safeParse({
      amount: formData.get("amount"),
      fullName: formData.get("fullName") || undefined,
      email: formData.get("email") || undefined,
      message: formData.get("message") || undefined,
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Невірні дані" };
    }

    if (!session && (!parsed.data.fullName || !parsed.data.email)) {
      return { ok: false, error: "Вкажіть ім'я та email" };
    }

    const animal = await prisma.animal.findFirst({
      where: {
        slug: animalSlug,
        isPublic: true,
        shelter: { slug: shelterSlug },
      },
      include: { shelter: true },
    });

    if (!animal) {
      return { ok: false, error: "Котика не знайдено" };
    }

    const donation = await prisma.donation.create({
      data: {
        shelterId: animal.shelterId,
        animalId: animal.id,
        donorId: session?.appUser.id,
        amount: parsed.data.amount,
        type: DonationType.ONE_TIME,
        message: parsed.data.message,
        status: PaymentStatus.PENDING,
      },
    });

    const purpose = `Допомога ${animal.name} #${donation.id.slice(0, 8)}`;
    const requisites = buildRequisites(
      animal.shelter,
      parsed.data.amount,
      purpose,
      donation.id,
    );

    if ("error" in requisites) {
      return { ok: false, error: requisites.error };
    }

    return { ok: true, requisites };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Помилка оформлення допомоги",
    };
  }
}

export async function submitSponsorshipAction(
  shelterSlug: string,
  animalSlug: string,
  _prev: PaymentActionResult | null,
  formData: FormData,
): Promise<PaymentActionResult> {
  try {
    const parsed = sponsorFormSchema.safeParse({
      monthlyAmount: formData.get("monthlyAmount"),
      fullName: formData.get("fullName") || undefined,
      email: formData.get("email") || undefined,
      password: formData.get("password") || undefined,
      message: formData.get("message") || undefined,
    });

    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Невірні дані" };
    }

    const animal = await prisma.animal.findFirst({
      where: {
        slug: animalSlug,
        isPublic: true,
        shelter: { slug: shelterSlug },
      },
      include: { shelter: true },
    });

    if (!animal) {
      return { ok: false, error: "Котика не знайдено" };
    }

    const monthlyGoal = decimalToNumber(animal.monthlyGoal);
    const minAmount =
      decimalToNumber(animal.minCuratorshipAmount) ??
      (monthlyGoal != null ? Math.min(monthlyGoal, 500) : 500);

    if (parsed.data.monthlyAmount < minAmount) {
      return {
        ok: false,
        error: `Мінімальна щомісячна допомога — ${minAmount} ₴`,
      };
    }

    const { userId, needsEmailConfirm } = await resolveSponsorUser(formData);

    const existing = await prisma.sponsorship.findUnique({
      where: {
        animalId_sponsorId: { animalId: animal.id, sponsorId: userId },
      },
    });

    if (existing && existing.status !== SponsorshipStatus.CANCELLED) {
      return {
        ok: false,
        error: "Ви вже оформили кураторство для цього котика",
      };
    }

    const sponsorship = existing
      ? await prisma.sponsorship.update({
          where: { id: existing.id },
          data: {
            monthlyAmount: parsed.data.monthlyAmount,
            message: parsed.data.message,
            status: SponsorshipStatus.PENDING,
            endedAt: null,
          },
        })
      : await prisma.sponsorship.create({
          data: {
            animalId: animal.id,
            sponsorId: userId,
            monthlyAmount: parsed.data.monthlyAmount,
            message: parsed.data.message,
            status: SponsorshipStatus.PENDING,
          },
        });

    const purpose = `Кураторство ${animal.name} #${sponsorship.id.slice(0, 8)}`;
    const requisites = buildRequisites(
      animal.shelter,
      parsed.data.monthlyAmount,
      purpose,
      sponsorship.id,
    );

    if ("error" in requisites) {
      return { ok: false, error: requisites.error };
    }

    return {
      ok: true,
      requisites,
      needsEmailConfirm,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Помилка оформлення кураторства",
    };
  }
}
