import { JsonLd } from "@/components/seo/json-ld";
import { LandingAdoptedGallery } from "@/components/landing/landing-adopted-gallery";
import { LandingFunds } from "@/components/landing/landing-funds";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPaths } from "@/components/landing/landing-paths";
import { LandingResidents } from "@/components/landing/landing-residents";
import { LandingStatsStrip } from "@/components/landing/landing-stats-strip";
import { LandingStories } from "@/components/landing/landing-stories";
import { getHomepageData } from "@/lib/homepage-data";
import { buildAbsoluteUrl, buildPageMetadata, getMetadataBase } from "@/lib/seo/metadata";
import { setRequestLocale, getTranslations } from "next-intl/server";

const SHELTER_SLUG = "kotoxata";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "landing" });

  return buildPageMetadata({
    locale,
    pathname: "/",
    title: t("metaTitle"),
    description: t("heroSubtitle"),
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");

  const data = await getHomepageData(SHELTER_SLUG);

  const siteUrl = buildAbsoluteUrl(locale, "/");
  const logoUrl = new URL("/brand/logo.png", getMetadataBase()).toString();

  const statusLabels = {
    atHome: t("status.atHome"),
    seekingCurator: t("status.seekingCurator"),
    hasCuratorSeekingHome: t("status.hasCuratorSeekingHome"),
  };

  const fundItems = [
    { emoji: "🍽️", ...t.raw("funds.items.food") as { title: string; description: string } },
    { emoji: "🩺", ...t.raw("funds.items.vet") as { title: string; description: string } },
    { emoji: "🧼", ...t.raw("funds.items.care") as { title: string; description: string } },
    { emoji: "🏠", ...t.raw("funds.items.shelter") as { title: string; description: string } },
  ];

  const stats = data?.stats;
  const accentCats = data?.residents.filter((c) => c.coverUrl).slice(0, 2) ?? [];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "NGO",
          name: "KotoXata",
          alternateName: "Котохата",
          url: siteUrl,
          description: t("heroSubtitle"),
          logo: logoUrl,
          areaServed: "UA",
          knowsAbout: ["cat adoption", "animal shelter", "pet sponsorship"],
        }}
      />

      <div className="landing-page min-h-screen">
        <LandingHero
          shelterSlug={SHELTER_SLUG}
          latestNew={data?.latestNew ?? null}
          latestAdopted={data?.latestAdopted ?? null}
          headlineLine1={t("heroLine1")}
          headlineLine2={t("heroLine2")}
          subtitle={t("heroSubtitle")}
          ctaFindCat={t("ctaFindCat")}
          ctaCurator={t("ctaCurator")}
          badgeNew={t("heroBadgeNew")}
          badgeHome={t("heroBadgeHome")}
          waitingLabel={t("heroWaitingLabel")}
          homeLabel={t("heroHomeLabel")}
        />

        <LandingStatsStrip
          inCare={stats?.inCare ?? 0}
          adopted={stats?.adopted ?? 0}
          withCurators={data?.catsWithCurators ?? 0}
          inCareLabel={t("statsStrip.inCare")}
          adoptedLabel={t("statsStrip.adopted")}
          curatorsLabel={t("statsStrip.curators")}
          lifeHref={`/s/${SHELTER_SLUG}/life`}
          lifeLabel={t("statsStrip.lifeLink")}
          lifeCount={stats?.news ?? 0}
        />

        {data?.residents.length ? (
          <LandingResidents
            shelterSlug={SHELTER_SLUG}
            locale={locale}
            cats={data.residents}
            title={t("residents.title")}
            subtitle={t("residents.subtitle")}
            viewAll={t("residents.viewAll")}
            statusLabels={statusLabels}
          />
        ) : null}

        <LandingPaths
          shelterSlug={SHELTER_SLUG}
          homeTitle={t("paths.homeTitle")}
          homeText={t("paths.homeText")}
          homeCta={t("paths.homeCta")}
          curatorTitle={t("paths.curatorTitle")}
          curatorText={t("paths.curatorText")}
          curatorCta={t("paths.curatorCta")}
        />

        <LandingFunds
          title={t("funds.title")}
          intro={t("funds.intro")}
          note={t("funds.transparency")}
          items={fundItems}
          accentCats={accentCats}
        />

        {data?.stories.length ? (
          <LandingStories
            shelterSlug={SHELTER_SLUG}
            stories={data.stories}
            title={t("stories.title")}
            subtitle={t("stories.subtitle")}
            viewAll={t("stories.viewAll")}
            locale={locale}
          />
        ) : null}

        {data?.adoptedGallery.length ? (
          <LandingAdoptedGallery
            shelterSlug={SHELTER_SLUG}
            cats={data.adoptedGallery}
            title={t("adoptedGallery.title")}
            subtitle={t("adoptedGallery.subtitle")}
            badgeAtHome={t("adoptedGallery.badge")}
            viewAll={t("adoptedGallery.viewAll")}
          />
        ) : null}
      </div>
    </>
  );
}
