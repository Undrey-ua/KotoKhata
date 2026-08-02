"use client";

import { useActionState } from "react";
import type { AnimalFormData } from "@/lib/serialize";
import {
  AnimalPersonality,
  AnimalSex,
} from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { slugify } from "@/lib/slug";
import { DEFAULT_ANIMAL_LOCATION } from "@/lib/constants";
import { birthMonthLabelsUk } from "@/lib/animal-age";
import {
  personalityLabels,
  sexLabels,
  statusLabels,
  crmStatusOptions,
} from "@/lib/animal-labels";

type FormState = { error?: string } | null;

type SaveAction = (
  prevState: FormState,
  formData: FormData,
) => Promise<FormState>;

type AnimalFormProps = {
  shelterSlug: string;
  animal?: AnimalFormData;
  saveAction: SaveAction;
};

export function AnimalForm({ shelterSlug, animal, saveAction }: AnimalFormProps) {
  const [state, action, pending] = useActionState(saveAction, null);

  const defaultStatus =
    animal?.status &&
    crmStatusOptions.includes(animal.status as (typeof crmStatusOptions)[number])
      ? animal.status
      : "SEEKING_HOME";

  return (
    <form action={action} className="mx-auto max-w-2xl space-y-6">
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
      )}

      {!animal && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-5">
          <Label htmlFor="photo">Перше фото</Label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
          />
          <p className="text-xs text-muted-foreground">
            Необов&apos;язково. Стане обкладинкою в каталозі. Більше фото — після
            створення картки.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Ім&apos;я *</Label>
          <Input
            id="name"
            name="name"
            defaultValue={animal?.name}
            required
            onChange={(e) => {
              if (!animal) {
                const slugInput = document.getElementById("slug") as HTMLInputElement;
                if (slugInput && !slugInput.dataset.touched) {
                  slugInput.value = slugify(e.target.value);
                }
              }
            }}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="slug">Slug (URL) *</Label>
          <Input
            id="slug"
            name="slug"
            defaultValue={animal?.slug ?? ""}
            required
            pattern="[a-z0-9-]+"
            onInput={(e) => {
              (e.target as HTMLInputElement).dataset.touched = "true";
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sex">Стать</Label>
          <Select id="sex" name="sex" defaultValue={animal?.sex ?? "UNKNOWN"}>
            {Object.values(AnimalSex).map((v) => (
              <option key={v} value={v}>
                {sexLabels[v]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Статус</Label>
          <Select id="status" name="status" defaultValue={defaultStatus}>
            {crmStatusOptions.map((v) => (
              <option key={v} value={v}>
                {statusLabels[v]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthMonth">Місяць народження</Label>
          <Select
            id="birthMonth"
            name="birthMonth"
            defaultValue={animal?.birthMonth?.toString() ?? ""}
          >
            <option value="">—</option>
            {birthMonthLabelsUk.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="birthYear">Рік народження</Label>
          <Input
            id="birthYear"
            name="birthYear"
            type="number"
            min={1990}
            max={new Date().getFullYear()}
            step={1}
            defaultValue={animal?.birthYear ?? ""}
            placeholder="2020"
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="personality">Характер (для AI)</Label>
          <Select
            id="personality"
            name="personality"
            defaultValue={animal?.personality ?? "CALM"}
          >
            {Object.values(AnimalPersonality).map((v) => (
              <option key={v} value={v}>
                {personalityLabels[v]}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Опис</Label>
          <Textarea
            id="description"
            name="description"
            defaultValue={animal?.description ?? ""}
            rows={3}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="characterTraits">Риси характеру</Label>
          <Input
            id="characterTraits"
            name="characterTraits"
            defaultValue={animal?.characterTraits ?? ""}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Місце проживання</Label>
          <Input
            id="location"
            name="location"
            defaultValue={animal?.location ?? DEFAULT_ANIMAL_LOCATION}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthlyGoal">Місячна потреба (₴)</Label>
          <Input
            id="monthlyGoal"
            name="monthlyGoal"
            type="number"
            min={1}
            step={1}
            defaultValue={animal?.monthlyGoal ?? ""}
            placeholder="3000"
          />
          <p className="text-xs text-muted-foreground">
            Базова сума на місяць для цього котика. Використовується для прогрес-бару.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minCuratorshipAmount">Мін. кураторство (₴/міс)</Label>
          <Input
            id="minCuratorshipAmount"
            name="minCuratorshipAmount"
            type="number"
            min={1}
            step={1}
            defaultValue={animal?.minCuratorshipAmount ?? ""}
            placeholder="500"
          />
          <p className="text-xs text-muted-foreground">
            Мінімальна щомісячна допомога при оформленні кураторства.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="vaccinated"
            defaultChecked={animal?.vaccinated ?? false}
            className="h-4 w-4 rounded border-border"
          />
          Вакцинований
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="sterilized"
            defaultChecked={animal?.sterilized ?? false}
            className="h-4 w-4 rounded border-border"
          />
          Стерилізований
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isPublic"
            defaultChecked={animal?.isPublic ?? true}
            className="h-4 w-4 rounded border-border"
          />
          Публічна картка
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="isFeatured"
            defaultChecked={animal?.isFeatured ?? false}
            className="h-4 w-4 rounded border-border"
          />
          На головній сторінці
        </label>
        <p className="w-full text-xs text-muted-foreground">
          Лише один котик може бути на головній. Потрібне фото та публічна картка.
        </p>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Збереження…" : animal ? "Зберегти" : "Додати котика"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/crm/${shelterSlug}/animals`}>Скасувати</Link>
        </Button>
      </div>
    </form>
  );
}
