import { Link } from "@/i18n/navigation";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import type { HomepageCat } from "@/lib/homepage-data";

type LandingAdoptedGalleryProps = {
  shelterSlug: string;
  cats: HomepageCat[];
  title: string;
  subtitle: string;
  badgeAtHome: string;
  viewAll: string;
};

export function LandingAdoptedGallery({
  shelterSlug,
  cats,
  title,
  subtitle,
  badgeAtHome,
  viewAll,
}: LandingAdoptedGalleryProps) {
  if (!cats.length) return null;

  return (
    <section className="border-y border-[var(--landing-border)] bg-[var(--landing-green-soft)]/50 py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-[var(--landing-text)] sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 text-base text-[var(--landing-muted)]">
            {subtitle}
          </p>
        </div>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {cats.map((cat) => (
            <Link
              key={cat.id}
              href={`/s/${shelterSlug}/cats/${cat.slug}`}
              className="group w-[min(72vw,220px)] shrink-0 cursor-pointer sm:w-[200px]"
            >
              <article className="overflow-hidden rounded-2xl bg-[var(--landing-card)] shadow-sm transition hover:shadow-md">
                <div className="relative aspect-square overflow-hidden bg-[var(--landing-beige)]">
                  <AnimalCardImage
                    src={cat.coverUrl}
                    name={cat.name}
                    objectFit="cover"
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute bottom-2 left-2 rounded-full bg-[var(--landing-green)] px-2.5 py-1 text-[11px] font-semibold text-white">
                    {badgeAtHome}
                  </span>
                </div>
                <p className="px-3 py-2.5 text-sm font-semibold text-[var(--landing-text)]">
                  {cat.name}
                </p>
              </article>
            </Link>
          ))}
        </div>

        <Link
          href={`/s/${shelterSlug}/cats?support=adopted`}
          className="mt-6 inline-flex text-sm font-semibold text-[var(--landing-green)] transition hover:opacity-80"
        >
          {viewAll} →
        </Link>
      </div>
    </section>
  );
}
