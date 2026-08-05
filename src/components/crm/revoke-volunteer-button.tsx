"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Button } from "@/components/ui/button";
import { revokeVolunteerAccessFromProfileAction } from "@/actions/volunteers";

type RevokeVolunteerButtonProps = {
  shelterSlug: string;
  memberId: string;
  volunteerName: string;
  blocked?: boolean;
  blockedReason?: string;
};

export function RevokeVolunteerButton({
  shelterSlug,
  memberId,
  volunteerName,
  blocked = false,
  blockedReason = "Не можна забрати доступ",
}: RevokeVolunteerButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleRevoke() {
    if (blocked) return;

    const confirmed = window.confirm(
      `Забрати доступ у «${volunteerName}»?\n\nКористувач більше не зможе працювати в CRM цього притулку.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await revokeVolunteerAccessFromProfileAction(
          shelterSlug,
          memberId,
        );
        if (result?.error) {
          setError(result.error);
        }
      } catch (e) {
        if (isRedirectError(e)) throw e;
        setError(e instanceof Error ? e.message : "Не вдалося забрати доступ");
      }
    });
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
      <p className="text-sm font-medium text-foreground">Небезпечна зона</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Забрати доступ волонтера до CRM притулку. Обліковий запис користувача
        залишиться, але членство буде видалено.
      </p>
      {blocked && (
        <p className="mt-2 text-xs text-amber-800">{blockedReason}</p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      <Button
        type="button"
        variant="outline"
        className="mt-3 border-red-200 text-red-600 hover:bg-red-50"
        disabled={blocked || pending}
        onClick={handleRevoke}
      >
        {pending ? "…" : "Забрати доступ"}
      </Button>
    </div>
  );
}
