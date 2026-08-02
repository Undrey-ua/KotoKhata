import type {
  CuratorRelationshipStatus,
  SponsorshipStatus,
} from "@prisma/client";

/** Default expected interval between curator contributions (days). */
export const DEFAULT_CONTRIBUTION_INTERVAL_DAYS = 30;

/** Days after which payment is considered overdue (friendly reminder zone). */
export const PAYMENT_OVERDUE_DAYS = 30;

/** Days after which payment needs personal contact. */
export const PAYMENT_CRITICAL_DAYS = 90;

/** Computed from last payment date — never stored in DB. */
export type ComputedPaymentTimeliness = "ON_TIME" | "OVERDUE" | "CRITICAL";

/** Suggested next step for volunteers — computed, not stored. */
export type CuratorRecommendedAction =
  | "NONE"
  | "SEND_REMINDER"
  | "CONTACT_CURATOR"
  | "FIND_NEW_CURATOR"
  | "PAUSED"
  | "AWAITING_CONFIRMATION";

export type CuratorshipPaymentInput = {
  curatorStatus: CuratorRelationshipStatus;
  workflowStatus: SponsorshipStatus;
  lastPaymentAt: Date | null;
  /** startedAt when no completed payment exists yet */
  referenceDate: Date;
  contributionIntervalDays?: number;
  now?: Date;
};

export type CuratorshipPaymentState = {
  paymentTimeliness: ComputedPaymentTimeliness;
  recommendedAction: CuratorRecommendedAction;
  lastPaymentAt: Date | null;
  nextExpectedPayment: Date;
  daysSinceReference: number;
  contributionIntervalDays: number;
};

export function daysBetween(from: Date, to: Date) {
  const ms = to.getTime() - from.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

export function computePaymentTimeliness(
  daysSinceReference: number,
  intervalDays: number,
): ComputedPaymentTimeliness {
  if (daysSinceReference < intervalDays) return "ON_TIME";
  if (daysSinceReference < PAYMENT_CRITICAL_DAYS) return "OVERDUE";
  return "CRITICAL";
}

export function computeRecommendedAction(
  curatorStatus: CuratorRelationshipStatus,
  workflowStatus: SponsorshipStatus,
  paymentTimeliness: ComputedPaymentTimeliness,
): CuratorRecommendedAction {
  if (workflowStatus === "PENDING") return "AWAITING_CONFIRMATION";
  if (curatorStatus === "PAUSED") return "PAUSED";
  if (curatorStatus === "ENDED") return "FIND_NEW_CURATOR";

  switch (paymentTimeliness) {
    case "ON_TIME":
      return "NONE";
    case "OVERDUE":
      return "SEND_REMINDER";
    case "CRITICAL":
      return "CONTACT_CURATOR";
    default:
      return "NONE";
  }
}

export function computeNextExpectedPayment(
  lastPaymentAt: Date | null,
  referenceDate: Date,
  intervalDays: number,
) {
  const base = lastPaymentAt ?? referenceDate;
  return new Date(base.getTime() + intervalDays * 24 * 60 * 60 * 1000);
}

/** Core service — reusable in CRM, Telegram bot, automations. */
export function computeCuratorshipPaymentState(
  input: CuratorshipPaymentInput,
): CuratorshipPaymentState {
  const intervalDays =
    input.contributionIntervalDays ?? DEFAULT_CONTRIBUTION_INTERVAL_DAYS;
  const now = input.now ?? new Date();

  const lastCompleted = input.lastPaymentAt;
  const reference = lastCompleted ?? input.referenceDate;
  const daysSinceReference = daysBetween(reference, now);
  const paymentTimeliness = computePaymentTimeliness(daysSinceReference, intervalDays);
  const recommendedAction = computeRecommendedAction(
    input.curatorStatus,
    input.workflowStatus,
    paymentTimeliness,
  );

  return {
    paymentTimeliness,
    recommendedAction,
    lastPaymentAt: lastCompleted,
    nextExpectedPayment: computeNextExpectedPayment(
      lastCompleted,
      input.referenceDate,
      intervalDays,
    ),
    daysSinceReference,
    contributionIntervalDays: intervalDays,
  };
}

/** Quick filter presets for CRM curator list. */
export type CuratorListFilter =
  | "all_active"
  | "paused"
  | "critical"
  | "need_reminder"
  | "need_contact";

export function matchesCuratorListFilter(
  state: CuratorshipPaymentState,
  curatorStatus: CuratorRelationshipStatus,
  filter: CuratorListFilter,
) {
  switch (filter) {
    case "all_active":
      return curatorStatus === "ACTIVE";
    case "paused":
      return curatorStatus === "PAUSED";
    case "critical":
      return state.paymentTimeliness === "CRITICAL" && curatorStatus === "ACTIVE";
    case "need_reminder":
      return state.recommendedAction === "SEND_REMINDER";
    case "need_contact":
      return state.recommendedAction === "CONTACT_CURATOR";
    default:
      return true;
  }
}

export function countBySummaryBucket(
  rows: { state: CuratorshipPaymentState; curatorStatus: CuratorRelationshipStatus }[],
) {
  let allGood = 0;
  let needReminder = 0;
  let needAttention = 0;

  for (const row of rows) {
    if (row.curatorStatus !== "ACTIVE") continue;
    if (row.state.recommendedAction === "NONE") allGood += 1;
    if (row.state.recommendedAction === "SEND_REMINDER") needReminder += 1;
    if (row.state.recommendedAction === "CONTACT_CURATOR") needAttention += 1;
  }

  return { allGood, needReminder, needAttention };
}
