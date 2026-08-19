import type { HomepageCat } from "@/lib/homepage-data";
import { AnimalCardImage } from "@/components/shared/animal-card-image";

type FundItem = {
  emoji: string;
  title: string;
  description: string;
};

type LandingFundsProps = {
  title: string;
  intro: string;
  note: string;
  items: FundItem[];
  accentCats: HomepageCat[];
};

export function LandingFunds({
  title,
  intro,
  note,
  items,
  accentCats,
}: LandingFundsProps) {
  const accent = accentCats[0];

  return (
    <section id="funds" className="border-t border-[var(--landing-border)] py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-start">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--landing-text)] sm:text-3xl">
              {title}
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-[var(--landing-muted)]">
              {intro}
            </p>

            <ul className="mt-8 space-y-5">
              {items.map((item, index) => (
                <li
                  key={item.title}
                  className="flex gap-4 rounded-2xl bg-[var(--landing-card)] p-4 shadow-sm sm:p-5"
                  style={{
                    marginLeft: index % 2 === 1 ? "0" : undefined,
                  }}
                >
                  <span className="text-2xl leading-none" aria-hidden>
                    {item.emoji}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[var(--landing-text)]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--landing-muted)]">
                      {item.description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-6 text-sm text-[var(--landing-muted)]">{note}</p>
          </div>

          {accent?.coverUrl && (
            <div className="relative lg:sticky lg:top-24">
              <div className="overflow-hidden rounded-[1.75rem] shadow-[0_24px_60px_-24px_rgba(58,53,48,0.35)]">
                <AnimalCardImage
                  src={accent.coverUrl}
                  name={accent.name}
                  objectFit="cover"
                  className="aspect-[4/5] w-full"
                />
              </div>
              <p className="mt-4 text-center text-sm font-medium text-[var(--landing-muted)]">
                {accent.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
