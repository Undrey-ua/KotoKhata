import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import { prisma } from "@/lib/db/prisma";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import {
  buildAbsoluteUrl,
  buildPageMetadata,
} from "@/lib/seo/metadata";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    select: { name: true, description: true },
  });

  if (!shelter) {
    return {};
  }

  const description =
    shelter.description ??
    (locale === "uk"
      ? `Притулок ${shelter.name} — котики, які шукають дім та опікунів.`
      : `${shelter.name} shelter — cats looking for a home and guardians.`);

  return buildPageMetadata({
    locale,
    pathname: `/s/${shelterSlug}`,
    title: shelter.name,
    description,
  });
}

export default async function ShelterPage({
  params,
}: {
  params: Promise<{ locale: string; shelterSlug: string }>;
}) {
  const { locale, shelterSlug } = await params;
  setRequestLocale(locale);

  const shelter = await prisma.shelter.findUnique({
    where: { slug: shelterSlug },
    include: {
      _count: { select: { animals: { where: { isPublic: true } } } },
    },
  });

  if (!shelter) {
    notFound();
  }

  const t = await getTranslations("common");
  const tc = await getTranslations("catalog");
  const pageUrl = buildAbsoluteUrl(locale, `/s/${shelterSlug}`);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "AnimalShelter",
          name: shelter.name,
          description: shelter.description ?? undefined,
          url: pageUrl,
          numberOfEmployees: undefined,
        }}
      />
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-border-cool bg-gradient-to-br from-card via-surface-cool to-[color-mix(in_srgb,var(--warm)_14%,white)] p-8 shadow-sm sm:p-12">
        <BrandLogo size={80} />
        <h1 className="mt-4 text-3xl font-bold text-foreground">{shelter.name}</h1>
        {shelter.description && (
          <p className="mt-4 max-w-2xl text-muted-foreground">{shelter.description}</p>
        )}
        <p className="mt-6 text-sm font-medium text-slate">
          {tc("shelterCatCount", { count: shelter._count.animals })}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/s/${shelterSlug}/cats`}>{t("viewCats")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">{t("backHome")}</Link>
          </Button>
        </div>
      </div>
    </div>
    </>
  );
}
