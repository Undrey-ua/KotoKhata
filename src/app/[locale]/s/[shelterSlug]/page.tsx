import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db/prisma";
import { setRequestLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="overflow-hidden rounded-2xl border border-border-cool bg-gradient-to-br from-card via-surface-cool to-[color-mix(in_srgb,var(--warm)_14%,white)] p-8 shadow-sm sm:p-12">
        <BrandLogo size={80} />
        <h1 className="mt-4 text-3xl font-bold text-foreground">{shelter.name}</h1>
        {shelter.description && (
          <p className="mt-4 max-w-2xl text-muted-foreground">{shelter.description}</p>
        )}
        <p className="mt-6 text-sm font-medium text-slate">
          {shelter._count.animals} cats in catalog
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href={`/s/${shelterSlug}/cats`}>{t("viewCats")}</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">На головну</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
