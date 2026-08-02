"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShelterMemberRole } from "@prisma/client";
import { UserPlus, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelVolunteerInviteAction,
  inviteVolunteerAction,
  revokeVolunteerAccessAction,
} from "@/actions/volunteers";
import type { VolunteerListItem } from "@/lib/crm/volunteers";

const roleLabels: Record<ShelterMemberRole, string> = {
  ADMIN: "Адмін",
  VOLUNTEER: "Волонтер",
  VETERINARIAN: "Ветеринар",
};

type InviteFormState = {
  error?: string;
  success?: boolean;
  message?: string;
} | null;

type VolunteersPanelProps = {
  shelterSlug: string;
  volunteers: VolunteerListItem[];
  isAdmin: boolean;
};

export function VolunteersPanel({
  shelterSlug,
  volunteers,
  isAdmin,
}: VolunteersPanelProps) {
  const [state, action, pending] = useActionState<InviteFormState, FormData>(
    async (_prev, formData) => inviteVolunteerAction(shelterSlug, _prev, formData),
    null,
  );
  const [revoking, startRevoke] = useTransition();
  const router = useRouter();

  function handleRevokeMember(memberId: string) {
    if (!confirm("Забрати доступ цього волонтера?")) return;
    startRevoke(async () => {
      await revokeVolunteerAccessAction(shelterSlug, memberId);
      router.refresh();
    });
  }

  function handleCancelInvite(inviteId: string) {
    if (!confirm("Скасувати запрошення?")) return;
    startRevoke(async () => {
      await cancelVolunteerInviteAction(shelterSlug, inviteId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            <h2 className="font-semibold text-foreground">Запросити волонтера</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Введіть email. Якщо людина ще не зареєстрована — доступ з&apos;явиться
            автоматично після реєстрації.
          </p>

          <form action={action} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex-1 space-y-2">
              <Label htmlFor="email" className="sr-only">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="volunteer@example.com"
                autoComplete="email"
              />
            </div>
            <Button type="submit" disabled={pending}>
              {pending ? "…" : "Запросити"}
            </Button>
          </form>

          {state?.error && (
            <p className="mt-3 text-sm text-destructive">{state.error}</p>
          )}
          {state?.success && state.message && (
            <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {state.message}
            </p>
          )}
        </div>
      )}

      <div className="rounded-xl border border-border-cool bg-card shadow-sm">
        <div className="border-b border-border-cool px-5 py-4">
          <h2 className="font-semibold text-foreground">Команда притулку</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {volunteers.length}{" "}
            {volunteers.length === 1 ? "учасник" : "учасників"}
          </p>
        </div>

        <ul className="divide-y divide-border-cool">
          {volunteers.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              Поки немає волонтерів
            </li>
          )}

          {volunteers.map((item) => {
            if (item.kind === "member") {
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">
                      {item.fullName ?? item.email}
                    </p>
                    {item.fullName && (
                      <p className="truncate text-sm text-muted-foreground">
                        {item.email}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-muted-foreground">
                      {roleLabels[item.role]} · з{" "}
                      {new Date(item.joinedAt).toLocaleDateString("uk-UA")}
                    </p>
                  </div>
                  {isAdmin && item.role !== ShelterMemberRole.ADMIN && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={revoking}
                      onClick={() => handleRevokeMember(item.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </li>
              );
            }

            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{item.email}</p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-amber-700">
                    <Clock className="h-3 w-3" />
                    Очікує реєстрації · запрошено{" "}
                    {new Date(item.createdAt).toLocaleDateString("uk-UA")}
                  </p>
                </div>
                {isAdmin && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={revoking}
                    onClick={() => handleCancelInvite(item.id)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
