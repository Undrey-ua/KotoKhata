import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { HomepageSpotlightCats } from "@/components/landing/homepage-spotlight-cats";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { getLatestAdoptedAnimal, getLatestNewAnimal, getShelterStats } from "@/lib/shelter-stats";
import { buildAbsoluteUrl, buildPageMetadata, getMetadataBase } from "@/lib/seo/metadata";
import { Heart, HandCoins, Sparkles, Cat, MessageCircle, Utensils, Stethoscope, Package, Building2 } from "lucide-react";

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
    title: t("heroTitle"),
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
  const ts = await getTranslations("stats");
  const tc = await getTranslations("catalog");

  const [stats, latestNew, latestAdopted] = await Promise.all([
    getShelterStats(SHELTER_SLUG),
    getLatestNewAnimal(SHELTER_SLUG),
    getLatestAdoptedAnimal(SHELTER_SLUG),
  ]);

  const statItems = [
    { value: stats?.inCare ?? 0, label: ts("inCare") },
    { value: stats?.adopted ?? 0, label: ts("adopted") },
    { value: stats?.guardians ?? 0, label: ts("guardians") },
    {
      value: stats?.news ?? 0,
      label: ts("news"),
      href: `/s/${SHELTER_SLUG}/life`,
    },
  ];

  const features = [
    {
      icon: Heart,
      title: t("features.connect.title"),
      description: t("features.connect.description"),
      iconClass: "bg-primary/12 text-primary",
    },
    {
      icon: HandCoins,
      title: t("features.curator.title"),
      description: t("features.curator.description"),
      iconClass: "bg-warm/25 text-primary",
    },
    {
      icon: Sparkles,
      title: t("features.support.title"),
      description: t("features.support.description"),
      iconClass: "bg-slate/12 text-slate",
    },
  ];

  const curatorshipSteps = [
    { icon: Cat, ...t.raw("curatorship.steps.choose") as { title: string; description: string } },
    { icon: HandCoins, ...t.raw("curatorship.steps.support") as { title: string; description: string } },
    { icon: MessageCircle, ...t.raw("curatorship.steps.connect") as { title: string; description: string } },
  ];

  const fundItems = [
    { icon: Utensils, ...t.raw("funds.items.food") as { title: string; description: string } },
    { icon: Stethoscope, ...t.raw("funds.items.vet") as { title: string; description: string } },
    { icon: Package, ...t.raw("funds.items.care") as { title: string; description: string } },
    { icon: Building2, ...t.raw("funds.items.shelter") as { title: string; description: string } },
  ];

  const siteUrl = buildAbsoluteUrl(locale, "/");
  const logoUrl = new URL("/brand/logo.png", getMetadataBase()).toString();

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
      <section className="relative overflow-hidden border-b border-border-cool/60">
        <div className="absolute inset-0 bg-gradient-to-br from-surface-cool via-background to-[color-mix(in_srgb,var(--warm)_15%,var(--background))]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <BrandLogo size={64} className="shadow-sm" />
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link href={`/s/${SHELTER_SLUG}/cats`}>{t("ctaFindFriend")}</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/#curatorship">{t("ctaSponsor")}</Link>
              </Button>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:ml-auto lg:max-w-lg">
            <div className="relative mb-5 overflow-hidden rounded-2xl border border-border-cool/70 bg-card/70 px-4 py-4 shadow-sm backdrop-blur-sm sm:px-5">
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-primary/80 to-warm/80"
                aria-hidden
              />
              <p className="text-pretty pl-2 text-[15px] leading-relaxed tracking-tight sm:text-base">
                <span className="font-semibold text-foreground">
                  {t("progressMissionLead")}
                </span>
                <span className="text-muted-foreground">
                  {": "}
                  {t("progressMission")}
                </span>
              </p>
            </div>
            <HomepageSpotlightCats
              shelterSlug={SHELTER_SLUG}
              latestNew={latestNew}
              latestAdopted={latestAdopted}
              newcomerBadge={t("newcomerBadge")}
              adoptedBadge={tc("adopted")}
              newcomerCaption={t("newcomerCaption")}
              adoptedCaption={t("adoptedCaption")}
              placeholder={t("featuredPlaceholder")}
            />
          </div>
        </div>
      </section>

      <section className="border-b border-border-cool bg-card">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:grid-cols-4 sm:px-6">
          {statItems.map(({ value, label, href }) => {
            const content = (
              <>
                <p className="text-3xl font-bold text-primary sm:text-4xl">{value}</p>
                <p className="mt-1 text-sm text-muted-foreground">{label}</p>
              </>
            );

            return (
              <div key={label} className="text-center">
                {href ? (
                  <Link
                    href={href}
                    className="block rounded-xl px-2 py-1 transition-colors hover:bg-surface-cool/60"
                  >
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section id="curatorship" className="border-b border-border-cool bg-card">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("curatorship.title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("curatorship.intro")}
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {curatorshipSteps.map(({ icon: Icon, title, description }, i) => (
              <article
                key={title}
                className="relative rounded-2xl border border-border-cool bg-surface-cool/40 p-6"
              >
                <span className="absolute -top-3 left-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>

          <p className="mx-auto mt-8 max-w-2xl text-center text-sm font-medium text-primary">
            {t("curatorship.note")}
          </p>
          <div className="mt-6 text-center">
            <Button asChild>
              <Link href={`/s/${SHELTER_SLUG}/cats`}>{t("curatorship.cta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="funds" className="section-stone border-b border-border-cool/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("funds.title")}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t("funds.intro")}
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {fundItems.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="flex gap-4 rounded-2xl border border-border-cool bg-card p-5 shadow-sm"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warm/25 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="help" className="section-cool border-b border-border-cool/60">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="mb-8 text-center text-2xl font-bold text-foreground">
            {t("howToHelp")}
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map(({ icon: Icon, title, description, iconClass }) => (
              <article
                key={title}
                className="rounded-2xl border border-border-cool bg-card p-6 shadow-sm"
              >
                <div
                  className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-charcoal">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <p className="text-sm font-medium uppercase tracking-wider text-charcoal-foreground/60">
            {t("stats.shelter")}: KotoXata
          </p>
          <h2 className="mt-2 text-2xl font-semibold">{t("stats.mission")}</h2>
          <p className="mx-auto mt-4 max-w-xl text-charcoal-foreground/75">
            {t("stats.missionText")}
          </p>
          <Button size="lg" variant="secondary" className="mt-8" asChild>
            <Link href={`/s/${SHELTER_SLUG}/cats`}>{t("ctaSponsor")}</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
