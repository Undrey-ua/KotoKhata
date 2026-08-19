import { Link } from "@/i18n/navigation";

type LandingPathsProps = {
  shelterSlug: string;
  homeTitle: string;
  homeText: string;
  homeCta: string;
  curatorTitle: string;
  curatorText: string;
  curatorCta: string;
};

export function LandingPaths({
  shelterSlug,
  homeTitle,
  homeText,
  homeCta,
  curatorTitle,
  curatorText,
  curatorCta,
}: LandingPathsProps) {
  return (
    <section id="curatorship" className="py-14 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-5 px-4 sm:px-6 lg:grid-cols-2">
        <article className="relative overflow-hidden rounded-[1.75rem] bg-[var(--landing-beige)] p-8 sm:p-10">
          <span className="text-3xl" aria-hidden>
            🏠
          </span>
          <h2 className="mt-4 text-2xl font-bold text-[var(--landing-text)]">
            {homeTitle}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
            {homeText}
          </p>
          <Link
            href={`/s/${shelterSlug}/cats`}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--landing-text)] px-6 py-3 text-sm font-semibold text-[var(--landing-card)] transition hover:opacity-90 sm:w-auto"
          >
            {homeCta}
          </Link>
        </article>

        <article className="relative overflow-hidden rounded-[1.75rem] border border-[var(--landing-border)] bg-[var(--landing-card)] p-8 shadow-sm sm:p-10">
          <span className="text-3xl" aria-hidden>
            ❤️
          </span>
          <h2 className="mt-4 text-2xl font-bold text-[var(--landing-text)]">
            {curatorTitle}
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[var(--landing-muted)] sm:text-base">
            {curatorText}
          </p>
          <Link
            href={`/s/${shelterSlug}/cats?support=needs_curator`}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--landing-terracotta)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--landing-terracotta-hover)] sm:w-auto"
          >
            {curatorCta}
          </Link>
        </article>
      </div>
    </section>
  );
}
