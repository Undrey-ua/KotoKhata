import { setRequestLocale } from "next-intl/server";
import { requireShelterMember } from "@/lib/auth/session";
import { getShelterStats } from "@/lib/shelter-stats";
import { getPendingPaymentsCount } from "@/lib/crm/pending-payments";
import { prisma } from "@/lib/db/prisma";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AnimalStatus } from "@prisma/client";
import { TelegramLinkCard } from "@/components/crm/telegram-link-card";
import { getVolunteerTelegramStatusAction } from "@/actions/telegram-link";

export const dynamic = "force-dynamic";

export default async function CrmDashboardPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);
  const ctx = await requireShelterMember(shelterSlug);

  const stats = await getShelterStats(shelterSlug);
  const pendingPaymentsCount = await getPendingPaymentsCount(ctx.shelterId);
  const telegramStatus = await getVolunteerTelegramStatusAction(shelterSlug);

  const [total, onSite, seekingHome] = await Promise.all([
    prisma.animal.count({ where: { shelterId: ctx.shelterId } }),
    prisma.animal.count({ where: { shelterId: ctx.shelterId, isPublic: true } }),
    prisma.animal.count({
      where: {
        shelterId: ctx.shelterId,
        status: { not: AnimalStatus.ADOPTED },
      },
    }),
  ]);

  const recentAnimals = await prisma.animal.findMany({
    where: { shelterId: ctx.shelterId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    select: { id: true, name: true, slug: true, status: true, updatedAt: true },
  });

  const statCards = [
    { label: "Усього в притулку", value: total },
    { label: "На сайті", value: onSite },
    { label: "Шукають дім", value: seekingHome },
    { label: "Опікуни", value: stats?.guardians ?? 0 },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Панель управління</h1>
        <p className="mt-1 text-muted-foreground">{ctx.shelter.name}</p>
      </div>

      {pendingPaymentsCount > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
          <p className="font-medium text-amber-900">
            {pendingPaymentsCount} платежів очікують підтвердження
          </p>
          <p className="mt-1 text-sm text-amber-800">
            Перевірте вхідні перекази та підтвердіть отримання коштів.
          </p>
          <Button asChild size="sm" className="mt-3">
            <Link href={`/crm/${shelterSlug}/payments`}>Перейти до фінансів</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value }) => (
          <div
            key={label}
            className="rounded-xl border border-border-cool bg-card p-5 shadow-sm"
          >
            <p className="text-3xl font-bold text-primary">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Динаміка допомоги</h2>
          <div className="mt-6 flex h-40 items-end justify-around gap-2 border-b border-border-cool pb-2">
            {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
              <div
                key={i}
                className="w-full max-w-8 rounded-t bg-primary/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Демо-графік — повна аналітика незабаром
          </p>
        </div>

        <div className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Джерела трафіку</h2>
          <ul className="mt-4 space-y-3">
            {[
              { label: "Пошук", pct: 45 },
              { label: "Соцмережі", pct: 30 },
              { label: "Прямі", pct: 15 },
              { label: "Інше", pct: 10 },
            ].map(({ label, pct }) => (
              <li key={label}>
                <div className="mb-1 flex justify-between text-sm">
                  <span>{label}</span>
                  <span className="text-muted-foreground">{pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-stone">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <TelegramLinkCard
          shelterSlug={shelterSlug}
          initialLinked={telegramStatus.linked}
          initialLinkedAt={telegramStatus.linkedAt}
          initialUsername={telegramStatus.username}
        />

        <div className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
          <h2 className="font-semibold text-foreground">Завдання</h2>
          <ul className="mt-4 space-y-2">
            {[
              "Візит до ветеринара",
              "Нове фото для картки",
              "Оновити опис",
              "Перевірити вакцинацію",
            ].map((task) => (
              <li
                key={task}
                className="flex items-center gap-3 rounded-lg border border-border-cool bg-surface-cool/40 px-3 py-2.5 text-sm"
              >
                <span className="h-4 w-4 rounded border border-border-cool" />
                {task}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground">
            Завдання з Telegram-бота — незабаром
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border-cool bg-card p-5 shadow-sm">
        <h2 className="font-semibold text-foreground">Останні оновлення</h2>
        <ul className="mt-4 divide-y divide-border-cool">
          {recentAnimals.map((animal) => (
            <li key={animal.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-foreground">{animal.name}</p>
                <p className="text-xs text-muted-foreground">
                  {animal.updatedAt.toLocaleDateString("uk-UA")}
                </p>
              </div>
              <Link
                href={`/crm/${shelterSlug}/animals/${animal.id}`}
                className="text-sm text-primary hover:underline"
              >
                Відкрити
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Button asChild>
        <Link href={`/crm/${shelterSlug}/animals/new`}>+ Додати котика</Link>
      </Button>
    </div>
  );
}
