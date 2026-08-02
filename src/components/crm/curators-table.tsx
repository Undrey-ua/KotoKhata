import { Link } from "@/i18n/navigation";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { CuratorStatusSelect, StatusBadge } from "@/components/crm/curator-status-select";
import { Button } from "@/components/ui/button";
import { formatUah } from "@/lib/animal-funding";
import {
  formatPaymentDate,
  paymentTimelinessBadgeClass,
  paymentTimelinessLabels,
  recommendedActionBadgeClass,
  recommendedActionLabels,
} from "@/lib/crm/curator-labels";
import type { CrmCuratorshipRow } from "@/lib/crm/curators-list";

type CuratorsTableProps = {
  rows: CrmCuratorshipRow[];
  shelterSlug: string;
  locale?: string;
  emptyMessage?: string;
};

export function CuratorsTable({
  rows,
  shelterSlug,
  locale = "uk",
  emptyMessage = "Поки немає кураторів.",
}: CuratorsTableProps) {
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
        {rows.map((row) => (
          <li
            key={row.sponsorshipId}
            className="rounded-xl border border-border-cool bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <Link
                  href={`/crm/${shelterSlug}/curators/${row.curatorId}`}
                  className="font-semibold text-foreground hover:text-primary"
                >
                  {row.curatorName}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{row.email}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/crm/${shelterSlug}/curators/${row.curatorId}`}>
                  Відкрити
                </Link>
              </Button>
            </div>

            <Link
              href={`/crm/${shelterSlug}/animals/${row.animalId}`}
              className="mt-3 flex items-center gap-3 rounded-lg border border-border-cool bg-surface-cool/40 p-3"
            >
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border-cool">
                <AnimalCardImage
                  src={row.animalCoverUrl}
                  name={row.animalName}
                  objectFit="cover"
                  className="h-12 w-12"
                />
              </div>
              <div className="min-w-0">
                <p className="font-medium text-foreground">{row.animalName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatUah(row.monthlyAmount)}/міс
                </p>
              </div>
            </Link>

            <div className="mt-3 space-y-3 border-t border-border-cool pt-3">
              <div>
                <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Статус куратора
                </p>
                <CuratorStatusSelect
                  shelterSlug={shelterSlug}
                  sponsorshipId={row.sponsorshipId}
                  value={row.curatorStatus}
                  compact
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                <StatusBadge
                  label={paymentTimelinessLabels[row.paymentState.paymentTimeliness]}
                  className={paymentTimelinessBadgeClass[row.paymentState.paymentTimeliness]}
                />
                <StatusBadge
                  label={recommendedActionLabels[row.paymentState.recommendedAction]}
                  className={
                    recommendedActionBadgeClass[row.paymentState.recommendedAction]
                  }
                />
              </div>

              <dl className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Останній платіж</dt>
                  <dd className="mt-0.5 font-medium">
                    {row.paymentState.lastPaymentAt
                      ? formatPaymentDate(row.paymentState.lastPaymentAt, locale)
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Наступний внесок</dt>
                  <dd className="mt-0.5 font-medium">
                    {formatPaymentDate(row.paymentState.nextExpectedPayment, locale)}
                  </dd>
                </div>
              </dl>
            </div>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border border-border-cool bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-cool bg-surface-cool/60 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Куратор</th>
                <th className="px-4 py-3 font-medium">Кіт</th>
                <th className="px-4 py-3 font-medium">Статус куратора</th>
                <th className="px-4 py-3 font-medium">Статус платежів</th>
                <th className="px-4 py-3 font-medium">Рекомендація</th>
                <th className="px-4 py-3 font-medium">Останній платіж</th>
                <th className="px-4 py-3 font-medium">Наступний внесок</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border-cool">
              {rows.map((row) => (
                <tr key={row.sponsorshipId} className="transition-colors hover:bg-surface-cool/40">
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/${shelterSlug}/curators/${row.curatorId}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {row.curatorName}
                    </Link>
                    <p className="text-xs text-muted-foreground">{row.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/crm/${shelterSlug}/animals/${row.animalId}`}
                      className="flex items-center gap-2"
                    >
                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-border-cool">
                        <AnimalCardImage
                          src={row.animalCoverUrl}
                          name={row.animalName}
                          objectFit="cover"
                          className="h-10 w-10"
                        />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{row.animalName}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatUah(row.monthlyAmount)}/міс
                        </p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <CuratorStatusSelect
                      shelterSlug={shelterSlug}
                      sponsorshipId={row.sponsorshipId}
                      value={row.curatorStatus}
                      compact
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={paymentTimelinessLabels[row.paymentState.paymentTimeliness]}
                      className={paymentTimelinessBadgeClass[row.paymentState.paymentTimeliness]}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      label={recommendedActionLabels[row.paymentState.recommendedAction]}
                      className={
                        recommendedActionBadgeClass[row.paymentState.recommendedAction]
                      }
                    />
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    {row.paymentState.lastPaymentAt
                      ? formatPaymentDate(row.paymentState.lastPaymentAt, locale)
                      : "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                    {formatPaymentDate(row.paymentState.nextExpectedPayment, locale)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/crm/${shelterSlug}/curators/${row.curatorId}`}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Відкрити
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
