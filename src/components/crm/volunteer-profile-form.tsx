"use client";

import { useActionState } from "react";
import { ShelterMemberRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateVolunteerMemberAction } from "@/actions/volunteers";
import type { VolunteerDetail } from "@/lib/crm/volunteers";

const roleLabels: Record<ShelterMemberRole, string> = {
  ADMIN: "Адмін",
  VOLUNTEER: "Волонтер",
  VETERINARIAN: "Ветеринар",
};

type FormState = { error?: string; success?: boolean } | null;

type VolunteerProfileFormProps = {
  shelterSlug: string;
  volunteer: VolunteerDetail;
};

export function VolunteerProfileForm({
  shelterSlug,
  volunteer,
}: VolunteerProfileFormProps) {
  const boundAction = updateVolunteerMemberAction.bind(
    null,
    shelterSlug,
    volunteer.userId,
  );
  const [state, action, pending] = useActionState<FormState, FormData>(
    boundAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
      )}
      {state?.success && (
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Зміни збережено
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Ім&apos;я</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={volunteer.fullName ?? ""}
            autoComplete="name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={volunteer.phone ?? ""}
            autoComplete="tel"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Роль</Label>
          <Select id="role" name="role" defaultValue={volunteer.role}>
            {Object.entries(roleLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="bio">Про волонтера</Label>
          <Textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={volunteer.bio ?? ""}
            placeholder="Коротко про участь у притулку — цей текст з’явиться на сторінці «Контакти»"
          />
          <p className="text-xs text-muted-foreground">
            Опис для публічної сторінки контактів притулку.
          </p>
        </div>

        <div className="flex items-start gap-3 sm:col-span-2">
          <input
            id="showOnContacts"
            name="showOnContacts"
            type="checkbox"
            defaultChecked={volunteer.showOnContacts}
            className="mt-1 h-4 w-4 rounded border-border-cool"
          />
          <div>
            <Label htmlFor="showOnContacts" className="cursor-pointer">
              Показувати на сторінці «Контакти»
            </Label>
            <p className="text-xs text-muted-foreground">
              Картка з іменем, описом і контактами буде видима на сайті.
            </p>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Збереження…" : "Зберегти зміни"}
      </Button>
    </form>
  );
}
