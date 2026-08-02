import {
  PaymentStatus,
  SponsorshipStatus,
  CuratorRelationshipStatus,
  type DonationType,
} from "@prisma/client";
import type {
  ComputedPaymentTimeliness,
  CuratorRecommendedAction,
} from "@/lib/crm/curator-payment-status";

export const curatorRelationshipLabels: Record<CuratorRelationshipStatus, string> = {
  ACTIVE: "Активний",
  PAUSED: "На паузі",
  ENDED: "Завершив опікунство",
};

export const paymentTimelinessLabels: Record<ComputedPaymentTimeliness, string> = {
  ON_TIME: "Вчасно",
  OVERDUE: "Прострочено",
  CRITICAL: "Понад 90 днів",
};

export const recommendedActionLabels: Record<CuratorRecommendedAction, string> = {
  NONE: "Нічого робити не потрібно",
  SEND_REMINDER: "Надіслати дружнє нагадування",
  CONTACT_CURATOR: "Зв'язатися з куратором",
  FIND_NEW_CURATOR: "Запропонувати знайти нового куратора",
  PAUSED: "Куратор на паузі",
  AWAITING_CONFIRMATION: "Очікує підтвердження платежу",
};

export const curatorStatusBadgeClass: Record<CuratorRelationshipStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-amber-100 text-amber-800",
  ENDED: "bg-surface-stone text-muted-foreground",
};

export const paymentTimelinessBadgeClass: Record<ComputedPaymentTimeliness, string> = {
  ON_TIME: "bg-emerald-100 text-emerald-800",
  OVERDUE: "bg-orange-100 text-orange-800",
  CRITICAL: "bg-red-100 text-red-800",
};

export const recommendedActionBadgeClass: Record<CuratorRecommendedAction, string> = {
  NONE: "bg-emerald-50 text-emerald-700",
  SEND_REMINDER: "bg-amber-50 text-amber-800",
  CONTACT_CURATOR: "bg-red-50 text-red-800",
  FIND_NEW_CURATOR: "bg-surface-stone text-muted-foreground",
  PAUSED: "bg-amber-50 text-amber-700",
  AWAITING_CONFIRMATION: "bg-surface-cool text-muted-foreground",
};

export const sponsorshipStatusLabels: Record<SponsorshipStatus, string> = {
  PENDING: "Очікує підтвердження",
  ACTIVE: "Активне",
  PAUSED: "Призупинено",
  CANCELLED: "Скасовано",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "Очікує",
  COMPLETED: "Підтверджено",
  FAILED: "Відхилено",
  REFUNDED: "Повернено",
};

export function displayCuratorName(fullName: string | null, email: string) {
  return fullName?.trim() || email.split("@")[0];
}

const MONTHS_UK = [
  "січ", "лют", "бер", "кві", "тра", "чер",
  "лип", "сер", "вер", "жов", "лис", "гру",
] as const;

const MONTHS_EN = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Deterministic date formatting for SSR + client components. */
export function formatPaymentDate(date: Date, locale = "uk") {
  const d = date instanceof Date ? date : new Date(date);
  const months = locale === "en" ? MONTHS_EN : MONTHS_UK;
  return `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export type PaymentHistoryItem = {
  id: string;
  date: Date;
  amount: number;
  kind: "monthly" | "one_time";
  kindLabel: string;
  animalName: string | null;
  status: PaymentStatus;
};

export function donationTypeLabel(type: DonationType) {
  return type === "MONTHLY" ? "Щомісячний донат" : "Разова допомога";
}
