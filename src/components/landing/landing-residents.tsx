import { Link } from "@/i18n/navigation";
import type { HomepageCat } from "@/lib/homepage-data";
import { resolveHomepageCatStatusKey } from "@/lib/homepage-data";
import { LandingCatCard } from "@/components/landing/landing-cat-card";

type LandingResidentsProps = {
  shelterSlug: string;
  locale: string;
  cats: HomepageCat[];
  title: string;
  subtitle: string;
  viewAll: string;
  statusLabels: Record<
    "atHome" | "seekingCurator" | "hasCuratorSeekingHome",
    string
  >;
};

export function LandingResidents({
  shelterSlug,
  locale,
  cats,
  title,
  subtitle,
  viewAll,
  statusLabels,
}: LandingResidentsProps) {
  if (!cats.length) return null;

  return (
    <section id="residents" className="py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-[var(--landing-text)] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-2 text-base text-[var(--landing-muted)]">
              {subtitle}
            </p>
          </div>
          <Link
            href={`/s/${shelterSlug}/cats`}
            className="inline-flex shrink-0 items-center text-sm font-semibold text-[var(--landing-terracotta)] transition hover:text-[var(--landing-terracotta-hover)]"
          >
            {viewAll} →
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cats.map((cat, index) => {
            const statusKey = resolveHomepageCatStatusKey(
              cat.status,
              cat.funding,
            );
            return (
              <LandingCatCard
                key={cat.id}
                name={cat.name}
                slug={cat.slug}
                shelterSlug={shelterSlug}
                coverUrl={cat.coverUrl}
                birthDate={cat.birthDate}
                description={cat.description}
                locale={locale}
                statusLabel={statusLabels[statusKey]}
                statusKey={statusKey}
                className={index === 0 ? "sm:col-span-2 lg:col-span-2" : undefined}
                size={index === 0 ? "featured" : "default"}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
