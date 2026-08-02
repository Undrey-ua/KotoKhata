"use client";

import { useState, useTransition } from "react";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { Button } from "@/components/ui/button";

type DeleteAnimalButtonProps = {
  animalId: string;
  animalName: string;
  blocked?: boolean;
  blockedReason?: string;
  deleteAction: (animalId: string) => Promise<{ error?: string } | void>;
  variant?: "table" | "page";
};

export function DeleteAnimalButton({
  animalId,
  animalName,
  blocked = false,
  blockedReason = "Спочатку завершіть або скасуйте кураторство",
  deleteAction,
  variant = "table",
}: DeleteAnimalButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (blocked) return;

    const confirmed = window.confirm(
      `Видалити «${animalName}» назавжди?\n\nУсі фото та дані будуть стерті. Цю дію не можна скасувати.`,
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      try {
        const result = await deleteAction(animalId);
        if (result?.error) {
          setError(result.error);
        }
      } catch (e) {
        if (isRedirectError(e)) throw e;
        setError(e instanceof Error ? e.message : "Не вдалося видалити");
      }
    });
  }

  if (variant === "table") {
    return (
      <span className="inline-flex flex-col items-end gap-0.5">
        <button
          type="button"
          onClick={handleDelete}
          disabled={blocked || pending}
          title={blocked ? blockedReason : undefined}
          className="text-sm font-medium text-red-600 hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
        >
          {pending ? "…" : "Видалити"}
        </button>
        {error && <span className="max-w-[140px] text-right text-[10px] text-red-600">{error}</span>}
      </span>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50/50 p-4">
      <p className="text-sm font-medium text-foreground">Небезпечна зона</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Повне видалення картки — для помилково створених або дубльованих записів.
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
        onClick={handleDelete}
      >
        {pending ? "Видалення…" : "Видалити назавжди"}
      </Button>
    </div>
  );
}
