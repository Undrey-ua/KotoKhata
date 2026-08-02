"use client";

import { Link } from "@/i18n/navigation";
import { formatUah } from "@/lib/animal-funding";
import { formatPaymentDate } from "@/lib/crm/curator-labels";
import type { PendingPaymentItem } from "@/lib/crm/pending-payments";
import {
  confirmPendingDonationAction,
  confirmPendingSponsorshipAction,
  confirmPendingSponsorshipPaymentAction,
  rejectPendingDonationAction,
  rejectPendingSponsorshipAction,
} from "@/actions/payment-confirm";
import { ConfirmPaymentButton } from "@/components/crm/confirm-payment-button";

type PendingPaymentsTableProps = {
  items: PendingPaymentItem[];
  shelterSlug: string;
  locale?: string;
};

function kindLabel(kind: PendingPaymentItem["kind"]) {
  switch (kind) {
    case "curatorship":
      return "Кураторство";
    case "donation":
      return "Разова допомога";
    case "sponsorship_payment":
      return "Щомісячний платіж";
  }
}

function getItemActions(item: PendingPaymentItem, shelterSlug: string) {
  const confirmAction =
    item.kind === "curatorship"
      ? () => confirmPendingSponsorshipAction(shelterSlug, item.id)
      : item.kind === "donation"
        ? () => confirmPendingDonationAction(shelterSlug, item.id)
        : () => confirmPendingSponsorshipPaymentAction(shelterSlug, item.id);

  const rejectAction =
    item.kind === "curatorship"
      ? () => rejectPendingSponsorshipAction(shelterSlug, item.id)
      : item.kind === "donation"
        ? () => rejectPendingDonationAction(shelterSlug, item.id)
        : undefined;

  return { confirmAction, rejectAction };
}

function PendingPaymentCard({
  item,
  shelterSlug,
  locale,
}: {
  item: PendingPaymentItem;
  shelterSlug: string;
  locale: string;
}) {
  const person =
    item.kind === "donation"
      ? item.donorName ?? item.donorEmail ?? "Анонім"
      : item.curatorName;

  const personLink =
    item.kind !== "donation" ? `/crm/${shelterSlug}/curators/${item.curatorId}` : null;

  const animalName = item.kind === "donation" ? item.animalName : item.animalName;
  const animalSlug = item.kind === "donation" ? item.animalSlug : item.animalSlug;

  const { confirmAction, rejectAction } = getItemActions(item, shelterSlug);

  return (
    <li className="rounded-xl border border-border-cool bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {kindLabel(item.kind)}
          </p>
          <p className="mt-1 text-lg font-bold text-foreground">{formatUah(item.amount)}</p>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatPaymentDate(item.createdAt, locale)}
        </p>
      </div>

      <dl className="mt-3 space-y-2 border-t border-border-cool pt-3 text-sm">
        <div>
          <dt className="text-xs text-muted-foreground">Від кого</dt>
          <dd className="mt-0.5 font-medium">
            {personLink ? (
              <Link href={personLink} className="text-primary hover:underline">
                {person}
              </Link>
            ) : (
              person
            )}
            {item.kind === "curatorship" && (
              <p className="text-xs font-normal text-muted-foreground">{item.curatorEmail}</p>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Котик</dt>
          <dd className="mt-0.5">
            {animalName && animalSlug ? (
              <Link
                href={`/s/${shelterSlug}/cats/${animalSlug}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {animalName}
              </Link>
            ) : (
              <span className="text-muted-foreground">Загальний донат</span>
            )}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <ConfirmPaymentButton action={confirmAction} className="flex-1" />
        {rejectAction && (
          <ConfirmPaymentButton
            action={rejectAction}
            label="Відхилити"
            variant="outline"
            className="flex-1"
          />
        )}
      </div>
    </li>
  );
}

export function PendingPaymentsTable({
  items,
  shelterSlug,
  locale = "uk",
}: PendingPaymentsTableProps) {
  if (items.length === 0) {
    return (
      <p className="mt-6 rounded-xl border border-dashed border-border-cool bg-card p-12 text-center text-muted-foreground">
        Немає платежів, що очікують підтвердження.
      </p>
    );
  }

  return (
    <div className="mt-6">
      <ul className="space-y-3 md:hidden">
        {items.map((item) => (
          <PendingPaymentCard
            key={`${item.kind}-${item.id}`}
            item={item}
            shelterSlug={shelterSlug}
            locale={locale}
          />
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border border-border-cool bg-card shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-border-cool bg-surface-cool/60 text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Тип</th>
                <th className="px-4 py-3 font-medium">Від кого</th>
                <th className="px-4 py-3 font-medium">Котик</th>
                <th className="px-4 py-3 font-medium">Сума</th>
                <th className="px-4 py-3 font-medium">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-cool">
              {items.map((item) => {
                const person =
                  item.kind === "donation"
                    ? item.donorName ?? item.donorEmail ?? "Анонім"
                    : item.curatorName;

                const personLink =
                  item.kind !== "donation"
                    ? `/crm/${shelterSlug}/curators/${item.curatorId}`
                    : null;

                const animalName =
                  item.kind === "donation" ? item.animalName : item.animalName;
                const animalSlug =
                  item.kind === "donation" ? item.animalSlug : item.animalSlug;

                const { confirmAction, rejectAction } = getItemActions(item, shelterSlug);

                return (
                  <tr key={`${item.kind}-${item.id}`} className="hover:bg-surface-cool/40">
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {formatPaymentDate(item.createdAt, locale)}
                    </td>
                    <td className="px-4 py-3">{kindLabel(item.kind)}</td>
                    <td className="px-4 py-3">
                      {personLink ? (
                        <Link href={personLink} className="font-medium text-primary hover:underline">
                          {person}
                        </Link>
                      ) : (
                        <span>{person}</span>
                      )}
                      {item.kind === "curatorship" && (
                        <p className="text-xs text-muted-foreground">{item.curatorEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {animalName && animalSlug ? (
                        <Link
                          href={`/s/${shelterSlug}/cats/${animalSlug}`}
                          className="text-foreground hover:text-primary"
                        >
                          {animalName}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">Загальний донат</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium">{formatUah(item.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <ConfirmPaymentButton action={confirmAction} />
                        {rejectAction && (
                          <ConfirmPaymentButton
                            action={rejectAction}
                            label="Відхилити"
                            variant="outline"
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
