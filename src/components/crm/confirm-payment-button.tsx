"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";

type ConfirmPaymentButtonProps = {
  action: () => Promise<{ error?: string; success?: boolean }>;
  label?: string;
  variant?: "default" | "outline" | "ghost";
};

export function ConfirmPaymentButton({
  action,
  label = "Підтвердити",
  variant = "default",
}: ConfirmPaymentButtonProps) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <Button type="button" size="sm" variant={variant} disabled={pending} onClick={handleClick}>
      {pending ? "…" : label}
    </Button>
  );
}
