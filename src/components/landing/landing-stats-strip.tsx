import { Link } from "@/i18n/navigation";

type LandingStatsStripProps = {
  inCare: number;
  adopted: number;
  withCurators: number;
  inCareLabel: string;
  adoptedLabel: string;
  curatorsLabel: string;
  lifeHref: string;
  lifeLabel: string;
  lifeCount: number;
};

export function LandingStatsStrip({
  inCare,
  adopted,
  withCurators,
  inCareLabel,
  adoptedLabel,
  curatorsLabel,
  lifeHref,
  lifeLabel,
  lifeCount,
}: LandingStatsStripProps) {
  const items = [
    { emoji: "🐾", value: inCare, label: inCareLabel },
    { emoji: "🏠", value: adopted, label: adoptedLabel },
    { emoji: "❤️", value: withCurators, label: curatorsLabel },
  ];

  return (
    <section className="border-y border-[var(--landing-border)] bg-[var(--landing-card)]/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between">
        <ul className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
          {items.map(({ emoji, value, label }) => (
            <li
              key={label}
              className="flex items-start gap-3 text-[var(--landing-text)]"
            >
              <span className="text-xl leading-none" aria-hidden>
                {emoji}
              </span>
              <p className="text-sm leading-snug sm:text-[15px]">
                <span className="font-bold tabular-nums">{value}</span>{" "}
                <span className="text-[var(--landing-muted)]">{label}</span>
              </p>
            </li>
          ))}
        </ul>

        {lifeCount > 0 && (
          <Link
            href={lifeHref}
            className="inline-flex items-center gap-2 self-start rounded-full bg-[var(--landing-beige)] px-4 py-2 text-sm font-medium text-[var(--landing-text)] transition hover:bg-[var(--landing-beige-dark)]/30 md:self-auto"
          >
            <span aria-hidden>📷</span>
            {lifeLabel}
          </Link>
        )}
      </div>
    </section>
  );
}
