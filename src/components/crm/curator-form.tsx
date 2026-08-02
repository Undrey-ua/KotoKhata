"use client";

import { useActionState } from "react";
import { SponsorshipStatus } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { sponsorshipStatusLabels } from "@/lib/crm/curator-labels";

export type CuratorFormAnimalOption = {
  id: string;
  name: string;
  minCuratorshipAmount: number | null;
};

type FormState = { error?: string } | null;

type SaveAction = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

type CuratorFormProps = {
  shelterSlug: string;
  animals: CuratorFormAnimalOption[];
  saveAction: SaveAction;
};

export function CuratorForm({ shelterSlug, animals, saveAction }: CuratorFormProps) {
  const [state, action, pending] = useActionState(saveAction, null);

  return (
    <form action={action} className="mx-auto max-w-2xl space-y-6">
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="fullName">Ім&apos;я *</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Телефон</Label>
          <Input id="phone" name="phone" type="tel" autoComplete="tel" />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="animalId">Підопічний *</Label>
          <Select id="animalId" name="animalId" required defaultValue="">
            <option value="" disabled>
              Оберіть котика
            </option>
            {animals.map((animal) => (
              <option key={animal.id} value={animal.id}>
                {animal.name}
                {animal.minCuratorshipAmount != null
                  ? ` (мін. ${animal.minCuratorshipAmount} ₴/міс)`
                  : ""}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyAmount">Сума (₴/міс) *</Label>
          <Input
            id="monthlyAmount"
            name="monthlyAmount"
            type="number"
            min={1}
            step={1}
            required
            placeholder="500"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Статус кураторства</Label>
          <Select
            id="status"
            name="status"
            defaultValue={SponsorshipStatus.ACTIVE}
          >
            <option value={SponsorshipStatus.ACTIVE}>
              {sponsorshipStatusLabels.ACTIVE}
            </option>
            <option value={SponsorshipStatus.PENDING}>
              {sponsorshipStatusLabels.PENDING}
            </option>
          </Select>
          <p className="text-xs text-muted-foreground">
            «Очікує підтвердження» — потрапить у чергу Фінансів.
          </p>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="message">Коментар</Label>
          <Textarea
            id="message"
            name="message"
            rows={2}
            placeholder="Необов'язково — внутрішня нотатка до кураторства"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Збереження…" : "Додати куратора"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/crm/${shelterSlug}/curators`}>Скасувати</Link>
        </Button>
      </div>
    </form>
  );
}
