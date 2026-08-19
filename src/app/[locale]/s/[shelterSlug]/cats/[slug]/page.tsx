import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/shared/safe-image";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { JsonLd } from "@/components/seo/json-ld";
import { AnimalProfileActionsLoader } from "@/components/animal/animal-profile-actions-loader";
import {
  AnimalPhotoLightboxRoot,
  AnimalPhotoLightboxTrigger,
} from "@/components/animal/animal-photo-lightbox";
import { FundingProgress } from "@/components/animal/funding-progress";
import { formatAnimalAge } from "@/lib/animal-age";
import {
  personalityLabels,
  sexLabels,
  isAdopted,
} from "@/lib/animal-labels";
import { prisma } from "@/lib/db/prisma";
import { getAnimalFunding, decimalToNumber } from "@/lib/animal-funding";
import { toMediaItems, mediaDisplayUrl } from "@/lib/serialize";
import { buildAbsoluteUrl, buildPageMetadata, getMetadataBase } from "@/lib/seo/metadata";
import { Check, MapPin } from "lucide-react";

export const revalidate = 60;

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
  const { locale, shelterSlug, slug } = await params;
  const t = await getTranslations({ locale, namespace: "catalog" });

  const animal = await prisma.animal.findFirst({
    where: {
      slug,
      isPublic: true,
      shelter: { slug: shelterSlug },
    },
    select: {
      name: true,
      description: true,
      shelter: { select: { name: true } },
      media: {
        where: { type: "PHOTO", isPublic: true },
        orderBy: [{ isCover: "desc" }, { createdAt: "desc" }],
        take: 1,
        select: { id: true },
      },
    },
  });

  if (!animal) {
    return buildPageMetadata({
      locale,
      pathname: `/s/${shelterSlug}/cats/${slug}`,
      title: t("notFoundTitle"),
      description: t("notFoundDescription"),
      noIndex: true,
    });
  }

  const coverPath = animal.media[0]
    ? mediaDisplayUrl(animal.media[0].id)
    : "/brand/logo.png";
  const coverImage = new URL(coverPath, getMetadataBase()).toString();
  const description =
    animal.description ??
    (locale === "uk"
      ? `${animal.name} — мешканець притулку ${animal.shelter.name}. Станьте опікуном або подаруйте дім.`
      : `${animal.name} — a resident of ${animal.shelter.name}. Become a guardian or offer a home.`);

  return buildPageMetadata({
    locale,
    pathname: `/s/${shelterSlug}/cats/${slug}`,
    title: `${animal.name} — ${animal.shelter.name}`,
    description,
    images: [coverImage],
    type: "article",
  });
}

export default async function CatProfilePage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string; slug: string }>;
}) {
  const { locale, shelterSlug, slug } = await params;
  setRequestLocale(locale);
  const tp = await getTranslations("animalProfile");
  const tc = await getTranslations("catalog");
  const tPay = await getTranslations("payments");

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
        where: { isPublic: true, type: "ANIMAL_STORY" },
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
  const coverIndex = cover ? photos.findIndex((p) => p.id === cover.id) : 0;
  const gallery = photos.filter((p) => p.id !== cover?.id);
  const age = formatAnimalAge(animal.birthDate, locale);

  const lightboxLabels = {
    close: tp("closeGallery"),
    prev: tp("prevPhoto"),
    next: tp("nextPhoto"),
    photoCounter: tp.raw("photoCounter") as string,
    openGallery: tp("openGallery"),
  };

  const healthItems = [
    { ok: animal.vaccinated, label: tp("vaccinated") },
    { ok: animal.sterilized, label: tp("sterilized") },
  ];

  const homeStatusLabel = isAdopted(animal.status)
    ? tc("adopted")
    : tc("seekingHome");

  const profileUrl = buildAbsoluteUrl(locale, `/s/${shelterSlug}/cats/${slug}`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: animal.name,
          description: animal.description ?? undefined,
          url: profileUrl,
          image: cover ? new URL(cover.url, getMetadataBase()).toString() : undefined,
          brand: {
            "@type": "Organization",
            name: shelter.name,
          },
        }}
      />
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link
        href={`/s/${shelterSlug}/cats`}
        className="text-sm text-slate hover:text-foreground"
      >
        ← {tp("backToCatalog")}
      </Link>

      <AnimalPhotoLightboxRoot
        photos={photos}
        animalName={animal.name}
        labels={lightboxLabels}
      >
        <article className="mt-6 overflow-hidden rounded-2xl border border-border-cool bg-card shadow-sm">
          <div className="grid lg:grid-cols-[340px_1fr]">
            <div className="overflow-hidden border-b border-border-cool lg:border-b-0 lg:border-r">
              <AnimalPhotoLightboxTrigger
                index={coverIndex}
                disabled={photos.length === 0}
                className="relative block w-full"
              >
                <AnimalCardImage
                  src={cover?.url ?? null}
                  name={animal.name}
                  objectFit="cover"
                  className="aspect-[3/4] w-full"
                />
                {isAdopted(animal.status) && (
                  <span className="absolute bottom-3 left-3 rounded-md bg-emerald-600/95 px-2 py-1 text-xs font-medium text-white">
                    {tc("adopted")}
                  </span>
                )}
              </AnimalPhotoLightboxTrigger>
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
                <span
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    isAdopted(animal.status)
                      ? "bg-emerald-600/15 text-emerald-800"
                      : "bg-warm/25 text-primary"
                  }`}
                >
                  {homeStatusLabel}
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
                { label: tp("status"), value: homeStatusLabel },
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
              <ul className="mt-3 flex gap-2 overflow-x-auto pb-1 snap-x snap-mandatory">
                {gallery.map((photo) => {
                  const photoIndex = photos.findIndex((p) => p.id === photo.id);
                  return (
                    <li key={photo.id} className="shrink-0 snap-start">
                      <AnimalPhotoLightboxTrigger
                        index={photoIndex}
                        className="block aspect-[3/4] w-24 snap-start overflow-hidden rounded-lg border border-border-cool bg-surface-stone sm:w-28"
                      >
                        <SafeImage
                          src={photo.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </AnimalPhotoLightboxTrigger>
                    </li>
                  );
                })}
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

          <AnimalProfileActionsLoader
            shelterSlug={shelterSlug}
            animalSlug={animal.slug}
            animalName={animal.name}
            monthlyGoal={decimalToNumber(animal.monthlyGoal)}
            minCuratorshipAmount={decimalToNumber(animal.minCuratorshipAmount)}
          />
        </div>
      </article>
      </AnimalPhotoLightboxRoot>
    </div>
    </>
  );
}
