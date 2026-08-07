"use client";

import { useActionState } from "react";
import { LifeStoryType } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createNewsAction } from "@/actions/life-stories";

type FormState = { error?: string } | null;

type NewsFormProps = {
  shelterSlug: string;
  animals: Array<{ id: string; name: string; slug: string }>;
};

export function NewsForm({ shelterSlug, animals }: NewsFormProps) {
  async function saveAction(
    prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    return createNewsAction(shelterSlug, prevState, formData);
  }

  const [state, action, pending] = useActionState(saveAction, null);

  return (
    <form action={action} className="mx-auto max-w-2xl space-y-6">
      {state?.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{state.error}</p>
      )}

      <div className="space-y-2 rounded-xl border border-border bg-card p-5">
        <Label htmlFor="type">Тип публікації *</Label>
        <Select id="type" name="type" defaultValue={LifeStoryType.ANIMAL_STORY} required>
          <option value={LifeStoryType.ANIMAL_STORY}>Історія про котика</option>
          <option value={LifeStoryType.SHELTER_NEWS}>Новина притулку</option>
        </Select>
        <p className="text-xs text-muted-foreground">
          Історії про котиків — оновлення з життя мешканця. Новини притулку — збори,
          звіти, подяки та інше загальне.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-5">
        <Label htmlFor="animalId">Котик</Label>
        <Select id="animalId" name="animalId" defaultValue="">
          <option value="">— Оберіть котика —</option>
          {animals.map((animal) => (
            <option key={animal.id} value={animal.id}>
              {animal.name}
            </option>
          ))}
        </Select>
        <p className="text-xs text-muted-foreground">
          Потрібно лише для історій про котика.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-5">
        <Label htmlFor="title">Заголовок</Label>
        <Input
          id="title"
          name="title"
          placeholder="Напр.: Звіт за липень, Збір на корм…"
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground">
          Необов&apos;язково. Рекомендовано для новин притулку.
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-5">
        <Label htmlFor="content">Текст *</Label>
        <Textarea
          id="content"
          name="content"
          required
          rows={8}
          placeholder="Що сталося? Чим хочете поділитися з друзями притулку?"
        />
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-card p-5">
        <Label htmlFor="photos">Фото</Label>
        <input
          id="photos"
          name="photos"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground"
        />
        <p className="text-xs text-muted-foreground">
          До 5 фото, кожне — не більше 5 МБ (JPEG, PNG, WebP, GIF).
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card p-5">
        <input
          id="publish"
          name="publish"
          type="checkbox"
          defaultChecked
          className="h-4 w-4 rounded border-border"
        />
        <Label htmlFor="publish" className="cursor-pointer font-normal">
          Опублікувати одразу на сайті
        </Label>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Збереження…" : "Зберегти"}
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href={`/crm/${shelterSlug}/news`}>Скасувати</Link>
        </Button>
      </div>
    </form>
  );
}
