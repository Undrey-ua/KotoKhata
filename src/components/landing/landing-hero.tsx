import { Link } from "@/i18n/navigation";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import type { HomepageCatSpotlight } from "@/lib/shelter-stats";
import { cn } from "@/lib/utils";

type LandingHeroProps = {
  shelterSlug: string;
  latestNew: HomepageCatSpotlight | null;
  latestAdopted: HomepageCatSpotlight | null;
  headlineLine1: string;
  headlineLine2: string;
  subtitle: string;
  ctaFindCat: string;
  ctaCurator: string;
  badgeNew: string;
  badgeHome: string;
  waitingLabel: string;
  homeLabel: string;
};

function HeroCatTile({
  cat,
  href,
  badge,
  badgeClassName,
  label,
  className,
  priority = false,
}: {
  cat: HomepageCatSpotlight;
  href: string;
  badge: string;
  badgeClassName: string;
  label: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn("group relative block cursor-pointer overflow-hidden rounded-[1.5rem] shadow-[0_20px_50px_-20px_rgba(58,53,48,0.35)]", className)}
    >
      <div className="relative aspect-[3/4] min-h-[280px] w-full bg-[var(--landing-beige)] sm:min-h-[340px]">
        <AnimalCardImage
          src={cat.imageUrl}
          name={cat.name}
          objectFit="cover"
          loading={priority ? "eager" : "eager"}
          fetchPriority={priority ? "high" : "auto"}
          className={cn(
            "h-full w-full transition-transform duration-700 group-hover:scale-[1.04]",
            priority && "object-[center_20%]",
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <span
            className={cn(
              "inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md",
              badgeClassName,
            )}
          >
            {badge}
          </span>
          <p className="mt-2 text-lg font-semibold text-white drop-shadow-sm">
            {cat.name}
          </p>
          <p className="text-sm text-white/85">{label}</p>
        </div>
      </div>
    </Link>
  );
}

export function LandingHero({
  shelterSlug,
  latestNew,
  latestAdopted,
  headlineLine1,
  headlineLine2,
  subtitle,
  ctaFindCat,
  ctaCurator,
  badgeNew,
  badgeHome,
  waitingLabel,
  homeLabel,
}: LandingHeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -right-24 top-0 hidden h-72 w-72 rounded-full bg-[var(--landing-terracotta)]/8 blur-3xl sm:block"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -left-16 bottom-0 hidden h-64 w-64 rounded-full bg-[var(--landing-green)]/10 blur-3xl sm:block"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:items-center lg:gap-12 lg:py-16 xl:py-20">
        <div className="max-w-xl">
          <h1 className="text-[clamp(2rem,5vw,3.25rem)] font-bold leading-[1.08] tracking-tight text-[var(--landing-text)]">
            <span className="block">{headlineLine1}</span>
            <span className="mt-1 block text-[var(--landing-terracotta)]">
              {headlineLine2}
            </span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[var(--landing-muted)] sm:text-lg">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={`/s/${shelterSlug}/cats`}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--landing-terracotta)] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_-10px_rgba(196,104,68,0.65)] transition hover:bg-[var(--landing-terracotta-hover)] sm:w-auto"
            >
              {ctaFindCat}
            </Link>
            <Link
              href="/#curatorship"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[var(--landing-border)] bg-[var(--landing-card)] px-7 py-3.5 text-sm font-semibold text-[var(--landing-text)] transition hover:border-[var(--landing-terracotta)]/40 hover:bg-white sm:w-auto"
            >
              {ctaCurator}
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {latestAdopted ? (
              <HeroCatTile
                cat={latestAdopted}
                href={`/s/${shelterSlug}/cats/${latestAdopted.slug}`}
                badge={badgeHome}
                badgeClassName="bg-[var(--landing-green)]"
                label={homeLabel}
                className="translate-y-4 sm:translate-y-6"
                priority
              />
            ) : (
              <div className="flex aspect-[3/4] translate-y-4 items-center justify-center rounded-[1.5rem] bg-[var(--landing-beige)] p-4 text-center text-sm text-[var(--landing-muted)] sm:translate-y-6">
                {homeLabel}
              </div>
            )}
            {latestNew ? (
              <HeroCatTile
                cat={latestNew}
                href={`/s/${shelterSlug}/cats/${latestNew.slug}`}
                badge={badgeNew}
                badgeClassName="bg-[var(--landing-terracotta)]"
                label={waitingLabel}
                className="-translate-y-2 sm:-translate-y-3"
              />
            ) : (
              <div className="flex aspect-[3/4] -translate-y-2 items-center justify-center rounded-[1.5rem] bg-[var(--landing-beige)] p-4 text-center text-sm text-[var(--landing-muted)] sm:-translate-y-3">
                {waitingLabel}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
