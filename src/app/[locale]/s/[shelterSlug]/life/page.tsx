import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { LifeFeedPhotos } from "@/components/shelter/life-feed-photos";
import { prisma } from "@/lib/db/prisma";
import { getPublicShelterFeedPaginated } from "@/lib/shelter-life-stories";
import { parsePageParam } from "@/lib/pagination";
import { buildPageMetadata } from "@/lib/seo/metadata";
import { ListPagination } from "@/components/ui/list-pagination";

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
  searchParams,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const resolvedSearchParams = await searchParams;
  setRequestLocale(locale);
  const page = parsePageParam(resolvedSearchParams.page);

  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { name: true },
  });

  if (!shelter) {
    notFound();
  }

  const [t, tp, tPag, feed] = await Promise.all([
    getTranslations("shelterLife"),
    getTranslations("animalProfile"),
    getTranslations("pagination"),
    getPublicShelterFeedPaginated(shelterSlug, { page }),
  ]);
  const items = feed.items;

  const lightboxLabels = {
    close: tp("closeGallery"),
    prev: tp("prevPhoto"),
    next: tp("nextPhoto"),
    photoCounter: tp.raw("photoCounter") as string,
    openGallery: tp("openGallery"),
  };

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

        {items.length === 0 ? (
          <p className="mt-10 rounded-2xl border border-dashed border-border-cool bg-card/80 p-12 text-center text-muted-foreground">
            {t("empty")}
          </p>
        ) : (
          <ol className="mt-10 space-y-5">
            {items.map((item) => {
              const date = item.publishedAt ?? item.createdAt;
              const isShelterNews = item.type === "SHELTER_NEWS";

              return (
                <li
                  key={item.id}
                  className="rounded-2xl border border-border-cool bg-card p-5 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {isShelterNews ? (
                        <>
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                            {t("shelterNewsBadge")}
                          </span>
                          {item.title && (
                            <span className="font-semibold text-foreground">
                              {item.title}
                            </span>
                          )}
                        </>
                      ) : (
                        <Link
                          href={`/s/${shelterSlug}/cats/${item.animal.slug}`}
                          className="font-semibold text-foreground hover:text-primary"
                        >
                          {item.animal.name}
                        </Link>
                      )}
                    </div>
                    <time className="text-xs text-muted-foreground">
                      {date.toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {item.content}
                  </p>
                  {item.authorName && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t("fromVolunteer", { name: item.authorName })}
                    </p>
                  )}
                  {item.photoUrls.length > 0 && (
                    <LifeFeedPhotos
                      photoUrls={item.photoUrls}
                      altLabel={
                        isShelterNews
                          ? item.title ?? t("shelterNewsBadge")
                          : item.animal.name
                      }
                      labels={lightboxLabels}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        )}

        <ListPagination
          page={feed.page}
          totalPages={feed.totalPages}
          total={feed.total}
          pageSize={feed.pageSize}
          pathname={`/s/${shelterSlug}/life`}
          labels={{
            range: tPag("range"),
            previous: tPag("previous"),
            loadMore: tPag("loadMore"),
            pageOf: tPag("pageOf"),
          }}
        />
      </div>
    </div>
  );
}
