"use client";

import { useTransition } from "react";
import { LifeStoryType } from "@prisma/client";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  deleteNewsAction,
  toggleNewsPublishAction,
} from "@/actions/life-stories";
import type { CrmNewsListItem } from "@/lib/crm/news-list";

type NewsListPanelProps = {
  rows: CrmNewsListItem[];
  shelterSlug: string;
};

function excerpt(text: string, max = 120) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function NewsListPanel({ rows, shelterSlug }: NewsListPanelProps) {
  const [pending, startTransition] = useTransition();

  if (!rows.length) {
    return (
      <p className="mt-8 rounded-xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
        Ще немає публікацій. Додайте першу новину або історію з життя котика.
      </p>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {rows.map((row) => {
        const date = row.publishedAt ?? row.createdAt;
        const typeLabel =
          row.type === LifeStoryType.SHELTER_NEWS
            ? "Новина притулку"
            : row.animal?.name ?? "Історія котика";

        return (
          <li
            key={row.id}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={
                      row.type === LifeStoryType.SHELTER_NEWS
                        ? "rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
                        : "rounded-full bg-surface-stone px-2 py-0.5 text-xs font-medium text-muted-foreground"
                    }
                  >
                    {typeLabel}
                  </span>
                  {!row.isPublic && (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      Чернетка
                    </span>
                  )}
                </div>
                {row.title && (
                  <p className="mt-2 font-semibold text-foreground">{row.title}</p>
                )}
                <p className="mt-1 text-sm text-muted-foreground">
                  {excerpt(row.content)}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {date.toLocaleDateString("uk-UA", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {row.authorName ? ` · ${row.authorName}` : ""}
                  {row.photoCount > 0 ? ` · ${row.photoCount} фото` : ""}
                </p>
                {row.animal && row.type === LifeStoryType.ANIMAL_STORY && (
                  <Link
                    href={`/s/${shelterSlug}/cats/${row.animal.slug}`}
                    className="mt-2 inline-block text-xs text-primary hover:underline"
                  >
                    Картка {row.animal.name}
                  </Link>
                )}
              </div>

              <div className="flex shrink-0 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() =>
                      toggleNewsPublishAction(shelterSlug, row.id, !row.isPublic),
                    )
                  }
                >
                  {row.isPublic ? "Приховати" : "Опублікувати"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  disabled={pending}
                  onClick={() => {
                    if (
                      window.confirm("Видалити цю публікацію? Цю дію не можна скасувати.")
                    ) {
                      startTransition(() => deleteNewsAction(shelterSlug, row.id));
                    }
                  }}
                >
                  Видалити
                </Button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
