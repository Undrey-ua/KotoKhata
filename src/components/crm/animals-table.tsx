import { Link } from "@/i18n/navigation";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { DeleteAnimalButton } from "@/components/crm/delete-animal-button";
import { Button } from "@/components/ui/button";
import { getCrmStatusLabel } from "@/lib/animal-labels";
import { formatUah } from "@/lib/animal-funding";
import type { CrmAnimalRow } from "@/lib/crm/animals-list";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Star } from "lucide-react";

type AnimalsTableProps = {
  rows: CrmAnimalRow[];
  shelterSlug: string;
  emptyMessage?: string;
  onDelete?: (animalId: string) => Promise<{ error?: string } | void>;
};

function FundingCell({ row }: { row: CrmAnimalRow }) {
  const { funding } = row;

  if (funding.monthlyGoal == null) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  if (!funding.hasCurators) {
    return (
      <div className="min-w-[140px]">
        <p className="text-xs text-muted-foreground">0 / {formatUah(funding.monthlyGoal)}</p>
        <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-stone">
          <div className="h-full w-0 rounded-full bg-primary" />
        </div>
      </div>
    );
  }

  const percent = funding.fundedPercent ?? 0;

  return (
    <div className="min-w-[140px]">
      <p className="text-xs font-medium text-foreground">
        {formatUah(funding.fundedMonthly)} / {formatUah(funding.monthlyGoal)}
        <span className="ml-1 text-muted-foreground">({percent}%)</span>
      </p>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-stone">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            percent >= 100 ? "bg-primary" : "bg-primary/80",
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

function CuratorsCell({ row }: { row: CrmAnimalRow }) {
  if (row.curators.length === 0 && row.pendingCount === 0) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="space-y-1">
      {row.curators.map((curator) => (
        <p key={curator.id} className="text-sm text-foreground">
          <span className="font-medium">{curator.name}</span>
          <span className="text-muted-foreground"> · {formatUah(curator.monthlyAmount)}/міс</span>
        </p>
      ))}
      {row.pendingCount > 0 && (
        <p className="text-xs text-amber-700">
          +{row.pendingCount} очікує підтвердження
        </p>
      )}
    </div>
  );
}

export function AnimalsTable({
  rows,
  shelterSlug,
  emptyMessage = "Поки немає котиків. Додайте першого.",
  onDelete,
}: AnimalsTableProps) {
  if (rows.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-border-cool bg-card p-12 text-center text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="mt-4 sm:mt-6">
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => {
          const deleteBlocked = row.funding.hasCurators || row.pendingCount > 0;

          return (
            <li
              key={row.id}
              className={cn(
                "rounded-xl border border-border-cool bg-card p-4 shadow-sm",
                row.funding.hasCurators && "border-primary/20 bg-warm/5",
              )}
            >
              <Link
                href={`/crm/${shelterSlug}/animals/${row.id}`}
                className="flex items-start gap-3"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-border-cool">
                  <AnimalCardImage
                    src={row.coverUrl}
                    name={row.name}
                    objectFit="cover"
                    className="h-14 w-14 object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.slug}</p>
                  <p className="mt-1 text-sm">{getCrmStatusLabel(row.status)}</p>
                </div>
              </Link>

              <div className="mt-3 flex flex-wrap gap-2">
                {row.isPublic ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    <Eye className="h-3 w-3" />
                    На сайті
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-surface-stone px-2 py-0.5 text-xs text-muted-foreground">
                    <EyeOff className="h-3 w-3" />
                    Прихований
                  </span>
                )}
                {row.isFeatured && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-800">
                    <Star className="h-3 w-3 fill-current" />
                    Головна
                  </span>
                )}
              </div>

              <div className="mt-3 space-y-2 border-t border-border-cool pt-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Потреба/міс</span>
                  <span className="font-medium">
                    {row.funding.monthlyGoal != null
                      ? formatUah(row.funding.monthlyGoal)
                      : "—"}
                  </span>
                </div>
                <FundingCell row={row} />
                {(row.curators.length > 0 || row.pendingCount > 0) && (
                  <CuratorsCell row={row} />
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild size="sm" className="flex-1 sm:flex-none">
                  <Link href={`/crm/${shelterSlug}/animals/${row.id}`}>Редагувати</Link>
                </Button>
                {onDelete && (
                  <DeleteAnimalButton
                    animalId={row.id}
                    animalName={row.name}
                    blocked={deleteBlocked}
                    deleteAction={onDelete}
                    variant="table"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border border-border-cool bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
          <thead>
            <tr className="border-b border-border-cool bg-surface-cool/60 text-xs uppercase tracking-wide text-muted-foreground">
              <th className="px-4 py-3 font-medium">Котик</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Сайт</th>
              <th className="px-4 py-3 font-medium">Потреба/міс</th>
              <th className="px-4 py-3 font-medium">Забезпечення</th>
              <th className="px-4 py-3 font-medium">Куратори</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border-cool">
            {rows.map((row) => {
              const deleteBlocked =
                row.funding.hasCurators || row.pendingCount > 0;

              return (
                <tr
                  key={row.id}
                  className={cn(
                    "transition-colors hover:bg-surface-cool/40",
                    row.funding.hasCurators && "bg-warm/5",
                  )}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/${shelterSlug}/animals/${row.id}`}
                      className="flex items-center gap-3"
                    >
                      <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border-cool">
                        <AnimalCardImage
                          src={row.coverUrl}
                          name={row.name}
                          objectFit="cover"
                          className="h-11 w-11 object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{row.name}</p>
                        <p className="text-xs text-muted-foreground">{row.slug}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="whitespace-nowrap text-sm">
                      {getCrmStatusLabel(row.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {row.isPublic ? (
                        <span className="inline-flex items-center gap-1 text-xs text-primary">
                          <Eye className="h-3.5 w-3.5" />
                          Так
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <EyeOff className="h-3.5 w-3.5" />
                          Ні
                        </span>
                      )}
                      {row.isFeatured && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-amber-700">
                          <Star className="h-3.5 w-3.5 fill-current" />
                          Головна
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {row.funding.monthlyGoal != null ? (
                      <span className="font-medium">{formatUah(row.funding.monthlyGoal)}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <FundingCell row={row} />
                  </td>
                  <td className="px-4 py-3">
                    <CuratorsCell row={row} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        href={`/crm/${shelterSlug}/animals/${row.id}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Редагувати
                      </Link>
                      {onDelete && (
                        <DeleteAnimalButton
                          animalId={row.id}
                          animalName={row.name}
                          blocked={deleteBlocked}
                          deleteAction={onDelete}
                          variant="table"
                        />
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
