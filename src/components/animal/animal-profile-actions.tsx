"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  submitDonationAction,
  submitSponsorshipAction,
  type PaymentActionResult,
} from "@/actions/payments";
import { formatUah } from "@/lib/animal-funding";
import { PaymentRequisites } from "@/components/animal/payment-requisites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ShareButton } from "@/components/shared/share-button";
import { X } from "lucide-react";

type Panel = "donate" | "sponsor" | null;

type AnimalProfileActionsProps = {
  shelterSlug: string;
  animalSlug: string;
  animalName: string;
  monthlyGoal: number | null;
  minCuratorshipAmount: number | null;
  isLoggedIn: boolean;
  userFullName?: string | null;
  userEmail?: string | null;
};

function PanelShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border-cool bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-xl font-semibold text-foreground">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted-foreground hover:bg-surface-stone hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function AnimalProfileActions({
  shelterSlug,
  animalSlug,
  animalName,
  monthlyGoal,
  minCuratorshipAmount,
  isLoggedIn,
  userFullName,
  userEmail,
}: AnimalProfileActionsProps) {
  const t = useTranslations("animalProfile");
  const tp = useTranslations("payments");
  const [panel, setPanel] = useState<Panel>(null);

  const defaultMonthly =
    monthlyGoal ??
    minCuratorshipAmount ??
    500;
  const minMonthly =
    minCuratorshipAmount ??
    (monthlyGoal != null ? Math.min(monthlyGoal, 500) : 500);

  const donateAction = submitDonationAction.bind(null, shelterSlug, animalSlug);
  const sponsorAction = submitSponsorshipAction.bind(null, shelterSlug, animalSlug);

  const [donateState, donateFormAction, donatePending] = useActionState<
    PaymentActionResult | null,
    FormData
  >(donateAction, null);

  const [sponsorState, sponsorFormAction, sponsorPending] = useActionState<
    PaymentActionResult | null,
    FormData
  >(sponsorAction, null);

  function closePanel() {
    setPanel(null);
  }

  return (
    <>
      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" type="button" onClick={() => setPanel("donate")}>
          {t("support")}
        </Button>
        <Button size="lg" variant="outline" type="button" onClick={() => setPanel("sponsor")}>
          {t("becomeCurator")}
        </Button>
        <ShareButton title={animalName} label={t("share")} />
      </div>

      {panel === "donate" && (
        <PanelShell title={t("support")} onClose={closePanel}>
          {donateState?.ok ? (
            <>
              <PaymentRequisites requisites={donateState.requisites} onClose={closePanel} />
            </>
          ) : (
            <form action={donateFormAction} className="space-y-4">
              <p className="text-sm text-muted-foreground">{tp("donateIntro")}</p>
              <div className="space-y-2">
                <Label htmlFor="donate-amount">{tp("amount")} *</Label>
                <Input
                  id="donate-amount"
                  name="amount"
                  type="number"
                  min={1}
                  step={1}
                  required
                  placeholder="500"
                />
              </div>
              {!isLoggedIn && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="donate-name">{tp("fullName")} *</Label>
                    <Input id="donate-name" name="fullName" required defaultValue={userFullName ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="donate-email">{tp("email")} *</Label>
                    <Input
                      id="donate-email"
                      name="email"
                      type="email"
                      required
                      defaultValue={userEmail ?? ""}
                    />
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="donate-message">{tp("message")}</Label>
                <Textarea id="donate-message" name="message" rows={2} />
              </div>
              {donateState && !donateState.ok && (
                <p className="text-sm text-red-600">{donateState.error}</p>
              )}
              <Button type="submit" className="w-full" disabled={donatePending}>
                {donatePending ? tp("submitting") : tp("showRequisites")}
              </Button>
            </form>
          )}
        </PanelShell>
      )}

      {panel === "sponsor" && (
        <PanelShell title={t("becomeCurator")} onClose={closePanel}>
          {sponsorState?.ok ? (
            <>
              {sponsorState.needsEmailConfirm && (
                <p className="mb-4 rounded-lg bg-warm/20 p-3 text-sm text-foreground">
                  {tp("emailConfirmHint")}
                </p>
              )}
              <PaymentRequisites requisites={sponsorState.requisites} onClose={closePanel} />
            </>
          ) : (
            <form action={sponsorFormAction} className="space-y-4">
              <p className="text-sm text-muted-foreground">{tp("sponsorIntro", { name: animalName })}</p>

              <div className="space-y-2">
                <Label htmlFor="sponsor-amount">{tp("monthlyAmount")} *</Label>
                <Input
                  id="sponsor-amount"
                  name="monthlyAmount"
                  type="number"
                  min={minMonthly}
                  step={1}
                  required
                  defaultValue={defaultMonthly}
                />
                <p className="text-xs text-muted-foreground">
                  {tp("minMonthly", { amount: formatUah(minMonthly) })}
                  {monthlyGoal != null && (
                    <> · {tp("recommendedMonthly", { amount: formatUah(monthlyGoal) })}</>
                  )}
                </p>
              </div>

              {!isLoggedIn ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-name">{tp("fullName")} *</Label>
                    <Input id="sponsor-name" name="fullName" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-email">{tp("email")} *</Label>
                    <Input id="sponsor-email" name="email" type="email" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sponsor-password">{tp("password")} *</Label>
                    <Input
                      id="sponsor-password"
                      name="password"
                      type="password"
                      minLength={6}
                      required
                      autoComplete="new-password"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {tp("loggedInAs", { email: userEmail ?? "" })}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="sponsor-message">{tp("message")}</Label>
                <Textarea id="sponsor-message" name="message" rows={2} />
              </div>

              {!isLoggedIn && (
                <p className="text-sm text-muted-foreground">
                  {tp("hasAccount")}{" "}
                  <Link href="/login" className="text-primary hover:underline">
                    {tp("signIn")}
                  </Link>
                </p>
              )}

              {sponsorState && !sponsorState.ok && (
                <p className="text-sm text-red-600">{sponsorState.error}</p>
              )}

              <Button type="submit" className="w-full" disabled={sponsorPending}>
                {sponsorPending ? tp("submitting") : tp("becomeCuratorSubmit")}
              </Button>
            </form>
          )}
        </PanelShell>
      )}
    </>
  );
}
