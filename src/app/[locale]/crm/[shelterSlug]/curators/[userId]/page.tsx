import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { requireShelterMember } from "@/lib/auth/session";
import { getCrmCuratorDetail } from "@/lib/crm/curator-detail";
import { CuratorNotesSection } from "@/components/crm/curator-notes-section";
import {
  CuratorWardActions,
  PaymentRowActions,
} from "@/components/crm/curator-payment-actions";
import { formatUah } from "@/lib/animal-funding";
import {
  formatPaymentDate,
  paymentTimelinessBadgeClass,
  paymentTimelinessLabels,
  recommendedActionLabels,
  paymentStatusLabels,
} from "@/lib/crm/curator-labels";
import { CuratorStatusSelect, StatusBadge } from "@/components/crm/curator-status-select";
import { cn } from "@/lib/utils";
import { Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

const paymentStatusClass: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  COMPLETED: "bg-primary/10 text-primary",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-surface-stone text-muted-foreground",
};

export default async function CrmCuratorDetailPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string; userId: string }>;
}) {
  const { locale, shelterSlug, userId } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const curator = await getCrmCuratorDetail(ctx.shelterId, userId);

  if (!curator) {
    notFound();
  }

  const totalMonthly = curator.wards
    .filter((w) => w.status === "ACTIVE" && w.curatorStatus === "ACTIVE")
    .reduce((sum, w) => sum + w.monthlyAmount, 0);

  return (
    <div className="space-y-8">
      <div>
        <Link
          href={`/crm/${shelterSlug}/curators`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Усі куратори
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-foreground">{curator.name}</h1>
        <p className="text-sm text-muted-foreground">
          Куратор з {formatPaymentDate(curator.memberSince, locale)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Контакти</h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="mt-0.5 flex items-center gap-2 font-medium">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${curator.email}`} className="text-primary hover:underline">
                  {curator.email}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Телефон</dt>
              <dd className="mt-0.5 flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                {curator.phone ? (
                  <a href={`tel:${curator.phone}`} className="font-medium hover:underline">
                    {curator.phone}
                  </a>
                ) : (
                  <span className="text-muted-foreground">Не вказано</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Загальна щомісячна допомога</dt>
              <dd className="mt-0.5 text-lg font-bold text-primary">
                {totalMonthly > 0 ? formatUah(totalMonthly) : "—"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Підопічні</h2>
          <ul className="mt-4 space-y-3">
            {curator.wards.map((ward) => (
              <li
                key={ward.sponsorshipId}
                className="rounded-lg border border-border-cool bg-surface-cool/40 px-4 py-3"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <Link
                      href={`/crm/${shelterSlug}/animals/${ward.animalId}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {ward.animalName}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      з {formatPaymentDate(ward.startedAt, locale)}
                    </p>
                    <p className="mt-2 font-medium sm:hidden">
                      {formatUah(ward.monthlyAmount)}/міс
                    </p>
                  </div>
                  <div className="w-full space-y-2 sm:max-w-xs sm:text-right">
                    <p className="hidden font-medium sm:block">
                      {formatUah(ward.monthlyAmount)}/міс
                    </p>
                    <CuratorStatusSelect
                      shelterSlug={shelterSlug}
                      sponsorshipId={ward.sponsorshipId}
                      value={ward.curatorStatus}
                      compact
                    />
                    <div className="flex flex-wrap gap-1 sm:justify-end">
                      <StatusBadge
                        label={paymentTimelinessLabels[ward.paymentState.paymentTimeliness]}
                        className={
                          paymentTimelinessBadgeClass[ward.paymentState.paymentTimeliness]
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {recommendedActionLabels[ward.paymentState.recommendedAction]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Наступний внесок:{" "}
                      {formatPaymentDate(ward.paymentState.nextExpectedPayment, locale)}
                    </p>
                    <div className="sm:flex sm:justify-end">
                      <CuratorWardActions
                        shelterSlug={shelterSlug}
                        sponsorshipId={ward.sponsorshipId}
                        status={ward.status}
                      />
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Історія платежів</h2>
        {curator.payments.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Платежів поки немає.</p>
        ) : (
          <>
            <ul className="mt-4 space-y-3 md:hidden">
              {curator.payments.map((payment) => (
                <li
                  key={payment.id}
                  className="rounded-lg border border-border-cool bg-surface-cool/30 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{formatUah(payment.amount)}</p>
                      <p className="text-sm text-muted-foreground">{payment.kindLabel}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatPaymentDate(payment.date, locale)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {payment.animalName ?? "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        paymentStatusClass[payment.status],
                      )}
                    >
                      {paymentStatusLabels[payment.status]}
                    </span>
                    <PaymentRowActions
                      shelterSlug={shelterSlug}
                      paymentId={payment.id}
                      status={payment.status}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border-cool text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">Дата</th>
                  <th className="pb-2 pr-4 font-medium">Тип</th>
                  <th className="pb-2 pr-4 font-medium">Підопічний</th>
                  <th className="pb-2 pr-4 font-medium">Сума</th>
                  <th className="pb-2 font-medium">Статус</th>
                  <th className="pb-2 font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-cool">
                {curator.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="py-3 pr-4 whitespace-nowrap">
                      {formatPaymentDate(payment.date, locale)}
                    </td>
                    <td className="py-3 pr-4">{payment.kindLabel}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {payment.animalName ?? "—"}
                    </td>
                    <td className="py-3 pr-4 font-medium">{formatUah(payment.amount)}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-xs font-medium",
                          paymentStatusClass[payment.status],
                        )}
                      >
                        {paymentStatusLabels[payment.status]}
                      </span>
                    </td>
                    <td className="py-3">
                      <PaymentRowActions
                        shelterSlug={shelterSlug}
                        paymentId={payment.id}
                        status={payment.status}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </>
        )}
      </section>

      <section className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Коментарі команди</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Внутрішні нотатки волонтерів та адмінів. Куратор їх не бачить.
        </p>
        <div className="mt-4">
          <CuratorNotesSection
            shelterSlug={shelterSlug}
            sponsorId={curator.id}
            notes={curator.notes}
            locale={locale}
          />
        </div>
      </section>
    </div>
  );
}
