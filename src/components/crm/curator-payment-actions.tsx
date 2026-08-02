"use client";

import { SponsorshipStatus, PaymentStatus } from "@prisma/client";
import { ConfirmPaymentButton } from "@/components/crm/confirm-payment-button";
import {
  confirmPendingSponsorshipAction,
  confirmPendingSponsorshipPaymentAction,
  rejectPendingSponsorshipAction,
} from "@/actions/payment-confirm";

type CuratorWardActionsProps = {
  shelterSlug: string;
  sponsorshipId: string;
  status: SponsorshipStatus;
};

export function CuratorWardActions({
  shelterSlug,
  sponsorshipId,
  status,
}: CuratorWardActionsProps) {
  if (status !== SponsorshipStatus.PENDING) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      <ConfirmPaymentButton
        action={() => confirmPendingSponsorshipAction(shelterSlug, sponsorshipId)}
      />
      <ConfirmPaymentButton
        action={() => rejectPendingSponsorshipAction(shelterSlug, sponsorshipId)}
        label="Відхилити"
        variant="outline"
      />
    </div>
  );
}

type PaymentRowActionsProps = {
  shelterSlug: string;
  paymentId: string;
  status: PaymentStatus;
};

export function PaymentRowActions({
  shelterSlug,
  paymentId,
  status,
}: PaymentRowActionsProps) {
  if (status !== PaymentStatus.PENDING) {
    return null;
  }

  return (
    <ConfirmPaymentButton
      action={() => confirmPendingSponsorshipPaymentAction(shelterSlug, paymentId)}
    />
  );
}
