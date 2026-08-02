"use client";

import { useActionState } from "react";
import { addCuratorNoteAction } from "@/actions/curators";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatPaymentDate } from "@/lib/crm/curator-labels";
import type { CrmCuratorNote } from "@/lib/crm/curator-detail";

type CuratorNotesSectionProps = {
  shelterSlug: string;
  sponsorId: string;
  notes: CrmCuratorNote[];
  locale?: string;
};

export function CuratorNotesSection({
  shelterSlug,
  sponsorId,
  notes,
  locale = "uk",
}: CuratorNotesSectionProps) {
  const action = addCuratorNoteAction.bind(null, shelterSlug, sponsorId);
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <div className="space-y-4">
      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">Коментарів поки немає.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-xl border border-border-cool bg-surface-cool/40 px-4 py-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{note.authorName}</span>
                <time>{formatPaymentDate(note.createdAt, locale)}</time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{note.content}</p>
            </li>
          ))}
        </ul>
      )}

      <form action={formAction} className="space-y-3 rounded-xl border border-border-cool bg-card p-4">
        <div className="space-y-2">
          <Label htmlFor="content">Новий коментар</Label>
          <Textarea
            id="content"
            name="content"
            rows={3}
            required
            placeholder="Внутрішня нотатка про куратора (не видна куратору)…"
          />
        </div>
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Збереження…" : "Додати коментар"}
        </Button>
      </form>
    </div>
  );
}
