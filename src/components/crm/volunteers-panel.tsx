"use client";

import { useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShelterMemberRole } from "@prisma/client";
import { UserPlus, Clock, Trash2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
  members: Extract<VolunteerListItem, { kind: "member" }>[];
  pendingInvites?: Extract<VolunteerListItem, { kind: "invite" }>[];
  totalCount?: number;
  isAdmin: boolean;
};

export function VolunteersPanel({
  shelterSlug,
  members,
  pendingInvites = [],
  totalCount,
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
            <h2 className="font-semibold text-foreground">Додати волонтера</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Створіть обліковий запис з email і паролем. Підтвердження пошти не
            потрібне — волонтер одразу може увійти через /uk/staff/login.
          </p>

          <form action={action} className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="fullName">Ім&apos;я</Label>
              <Input
                id="fullName"
                name="fullName"
                type="text"
                placeholder="Олена Коваленко"
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                placeholder="volunteer@example.com"
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                placeholder="Мінімум 6 символів"
                autoComplete="new-password"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={pending}>
                {pending ? "…" : "Додати волонтера"}
              </Button>
            </div>
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
            {totalCount ?? members.length}{" "}
            {(totalCount ?? members.length) === 1 ? "учасник" : "учасників"}
          </p>
        </div>

        <ul className="divide-y divide-border-cool">
          {pendingInvites.map((item) => (
            <li
              key={`invite-${item.id}`}
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
          ))}

          {members.length === 0 && pendingInvites.length === 0 && (
            <li className="px-5 py-8 text-center text-sm text-muted-foreground">
              Поки немає волонтерів
            </li>
          )}

          {members.map((item) => {
            const profileHref = `/crm/${shelterSlug}/volunteers/${item.userId}`;

            return (
              <li
                key={item.id}
                className="group flex items-center justify-between gap-2 px-5 py-4 transition-colors hover:bg-surface-cool/40"
              >
                <Link
                  href={profileHref}
                  className="min-w-0 flex-1 cursor-pointer rounded-md outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <p className="font-medium text-foreground group-hover:text-primary">
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
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  <Button asChild size="sm" variant="outline">
                    <Link href={profileHref}>Відкрити</Link>
                  </Button>
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
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
