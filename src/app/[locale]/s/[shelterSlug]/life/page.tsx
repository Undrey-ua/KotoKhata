import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { SafeImage } from "@/components/shared/safe-image";
import { prisma } from "@/lib/db/prisma";
import { getPublicShelterLifeStories } from "@/lib/shelter-life-stories";
import { buildPageMetadata } from "@/lib/seo/metadata";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { name: true },
  });

  if (!shelter) {
    return {};
  }

  const t = await getTranslations({ locale, namespace: "shelterLife" });

  return buildPageMetadata({
    locale,
    pathname: `/s/${shelterSlug}/life`,
    title: t("title"),
    description: t("subtitle"),
  });
}

export default async function ShelterLifePage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);

  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { name: true },
  });

  if (!shelter) {
    notFound();
  }

  const [t, stories] = await Promise.all([
    getTranslations("shelterLife"),
    getPublicShelterLifeStories(shelterSlug),
  ]);

  const dateLocale = locale === "uk" ? "uk-UA" : "en-GB";

  return (
    <div className="min-h-full bg-gradient-to-b from-surface-cool/80 to-background">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="max-w-2xl">
          <Link
            href={`/s/${shelterSlug}`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← {shelter.name}
          </Link>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-muted-foreground">{t("subtitle")}</p>
        </header>

        {stories.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border-cool bg-card/80 p-12 text-center text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ol className="mt-10 space-y-5">
            {stories.map((story) => {
              const date = story.publishedAt ?? story.createdAt;

              return (
                <li
                  key={story.id}
                  className="rounded-2xl border border-border-cool bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                      href={`/s/${shelterSlug}/cats/${story.animal.slug}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {story.animal.name}
                    </Link>
                    <time className="text-xs text-muted-foreground">
                      {date.toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {story.content}
                  </p>
                  {story.authorName && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("fromVolunteer", { name: story.authorName })}
                    </p>
                  )}
                  {story.photoUrls.length > 0 && (
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {story.photoUrls.map((url) => (
                        <li
                          key={url}
                          className="h-24 w-24 overflow-hidden rounded-lg border border-border-cool"
                        >
                          <SafeImage
                            src={url}
                            alt=""
                            className="h-full w-full bg-surface-stone object-cover"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
