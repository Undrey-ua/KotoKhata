import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/shared/safe-image";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { AnimalProfileActions } from "@/components/animal/animal-profile-actions";
import { FundingProgress } from "@/components/animal/funding-progress";
import { formatAnimalAge } from "@/lib/animal-age";
import {
  personalityLabels,
  sexLabels,
  getPublicHomeStatusShort,
  isAdopted,
} from "@/lib/animal-labels";
import { prisma } from "@/lib/db/prisma";
import { getAnimalFunding, decimalToNumber } from "@/lib/animal-funding";
import { getAppSession } from "@/lib/auth/session";
import { toMediaItems } from "@/lib/serialize";
import { Check, MapPin } from "lucide-react";

export const dynamic = "force-dynamic";

const sexIcon: Record<string, string> = {
  MALE: "♂",
  FEMALE: "♀",
  UNKNOWN: "•",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string; slug: string }>;
}) {
  const { shelterSlug, slug } = await params;

  const animal = await prisma.animal.findFirst({
    where: {
      slug,
      isPublic: true,
      shelter: { slug: shelterSlug },
    },
    select: { name: true, description: true },
  });

  if (!animal) {
    return { title: "Котик не знайдений" };
  }

  return {
    title: animal.name,
    description: animal.description ?? undefined,
  };
}

export default async function CatProfilePage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string; slug: string }>;
}) {
  const { locale, shelterSlug, slug } = await params;
  setRequestLocale(locale);
  const tp = await getTranslations("animalProfile");
  const tPay = await getTranslations("payments");

  const session = await getAppSession();

  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
  });

  if (!shelter) {
    notFound();
  }

  const animal = await prisma.animal.findFirst({
    where: {
      shelterId: shelter.id,
      slug,
      isPublic: true,
    },
    include: {
      media: {
        where: { type: "PHOTO", isPublic: true },
        orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
      },
      lifeStories: {
        where: { isPublic: true },
        orderBy: { publishedAt: "desc" },
        take: 5,
      },
    },
  });

  if (!animal) {
    notFound();
  }

  const funding = await getAnimalFunding(animal.id);
  const photos = toMediaItems(animal.media);
  const cover = photos.find((p) => p.isCover) ?? photos[0];
  const gallery = photos.filter((p) => p.id !== cover?.id);
  const age = formatAnimalAge(animal.birthDate, locale);

  const healthItems = [
    { ok: animal.vaccinated, label: tp("vaccinated") },
    { ok: animal.sterilized, label: tp("sterilized") },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href={`/s/${shelterSlug}/cats`}
        className="text-sm text-slate hover:text-foreground"
      >
        ← {tp("backToCatalog")}
      </Link>

      <article className="mt-6 overflow-hidden rounded-2xl border border-border-cool bg-card shadow-sm">
        <div className="grid lg:grid-cols-[340px_1fr]">
          <div className="border-b border-border-cool bg-surface-cool/40 p-4 lg:border-b-0 lg:border-r">
            {cover ? (
              <SafeImage
                src={cover.url}
                alt={animal.name}
                className="aspect-square w-full rounded-xl bg-surface-cool object-contain"
              />
            ) : (
              <AnimalCardImage
                src={null}
                name={animal.name}
                className="aspect-square w-full rounded-xl"
              />
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-foreground">{animal.name}</h1>
                  <span className="text-xl text-primary" aria-label={sexLabels[animal.sex]}>
                    {sexIcon[animal.sex]}
                  </span>
                </div>
                {animal.location && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    {animal.location}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-warm/25 px-3 py-1 text-sm font-medium text-primary">
                  {getPublicHomeStatusShort(animal.status)}
                </span>
                {funding.hasCurators && !isAdopted(animal.status) && (
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-medium text-primary">
                    {tPay("underCuratorship")}
                  </span>
                )}
              </div>
            </div>

            {funding.hasCurators && !isAdopted(animal.status) && (
              <div className="mt-4">
                <FundingProgress
                  animalName={animal.name}
                  funding={funding}
                  locale={locale}
                />
              </div>
            )}

            <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: tp("age"), value: age },
                { label: tp("sex"), value: sexLabels[animal.sex] },
                { label: tp("personality"), value: personalityLabels[animal.personality] },
                { label: tp("status"), value: getPublicHomeStatusShort(animal.status) },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="rounded-xl border border-border-cool bg-surface-cool/50 px-3 py-2.5"
                >
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-foreground">{value}</dd>
                </div>
              ))}
            </dl>

            {animal.description && (
              <div className="mt-6">
                <h2 className="font-semibold text-foreground">
                  {tp("about", { name: animal.name })}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {animal.description}
                </p>
              </div>
            )}

            {animal.characterTraits && (
              <p className="mt-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{tp("traits")}: </span>
                {animal.characterTraits}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border-cool p-6 sm:p-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {tp("health")}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-3">
            {healthItems.map(({ ok, label }) => (
              <li
                key={label}
                className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${
                  ok
                    ? "bg-primary/10 text-primary"
                    : "bg-surface-stone text-muted-foreground"
                }`}
              >
                <Check className="h-4 w-4" />
                {label}
              </li>
            ))}
          </ul>

          {gallery.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {tp("gallery")}
              </h2>
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((photo) => (
                  <li
                    key={photo.id}
                    className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border-cool"
                  >
                    <SafeImage
                      src={photo.url}
                      alt=""
                      className="h-full w-full bg-surface-stone object-contain"
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {animal.lifeStories.length > 0 && (
            <div className="mt-8">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                {tp("timeline")}
              </h2>
              <ul className="mt-3 space-y-2">
                {animal.lifeStories.map((story) => (
                  <li
                    key={story.id}
                    className="rounded-lg border border-border-cool bg-surface-cool/40 px-4 py-3 text-sm"
                  >
                    <p className="text-xs text-muted-foreground">
                      {story.publishedAt?.toLocaleDateString(locale === "uk" ? "uk-UA" : "en-GB")}
                    </p>
                    <p className="mt-1 text-foreground">{story.content}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <AnimalProfileActions
            shelterSlug={shelterSlug}
            animalSlug={animal.slug}
            animalName={animal.name}
            monthlyGoal={decimalToNumber(animal.monthlyGoal)}
            minCuratorshipAmount={decimalToNumber(animal.minCuratorshipAmount)}
            isLoggedIn={!!session}
            userFullName={session?.appUser.fullName}
            userEmail={session?.appUser.email}
          />
        </div>
      </article>
    </div>
  );
}
