"use client";

import { useTranslations } from "next-intl";
import type { PaymentRequisitesResult } from "@/actions/payments";
import { formatUah } from "@/lib/animal-funding";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

type PaymentRequisitesProps = {
  requisites: PaymentRequisitesResult;
  onClose?: () => void;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-xl border border-border-cool bg-surface-cool/50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 flex items-start justify-between gap-2">
        <p className="break-all text-sm font-medium text-foreground">{value}</p>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-surface-stone hover:text-foreground"
          aria-label={label}
        >
          {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

export function PaymentRequisites({ requisites, onClose }: PaymentRequisitesProps) {
  const t = useTranslations("payments");

  return (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
      <h3 className="text-lg font-semibold text-foreground">{t("requisitesTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("requisitesHint")}</p>

      <div className="mt-4 space-y-3">
        <CopyField label={t("amount")} value={formatUah(requisites.amount)} />
        <CopyField label={t("iban")} value={requisites.iban} />
        <CopyField label={t("recipient")} value={requisites.recipient} />
        {requisites.bankName && (
          <CopyField label={t("bank")} value={requisites.bankName} />
        )}
        <CopyField label={t("purpose")} value={requisites.purpose} />
      </div>

      <p className="mt-4 text-xs text-muted-foreground">{t("manualConfirm")}</p>

      {onClose && (
        <Button type="button" variant="outline" className="mt-4" onClick={onClose}>
          {t("close")}
        </Button>
      )}
    </div>
  );
}
