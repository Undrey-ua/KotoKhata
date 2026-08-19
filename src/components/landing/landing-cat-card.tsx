import { Link } from "@/i18n/navigation";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { formatAnimalAge } from "@/lib/animal-age";
import type { HomepageCatStatusKey } from "@/lib/homepage-data";
import { cn } from "@/lib/utils";

const statusStyles: Record<
  HomepageCatStatusKey,
  { badge: string; ring?: string }
> = {
  atHome: {
    badge: "bg-[var(--landing-green)] text-white",
    ring: "ring-[var(--landing-green)]/25",
  },
  seekingCurator: {
    badge: "bg-[var(--landing-terracotta)] text-white",
  },
  hasCuratorSeekingHome: {
    badge: "bg-[var(--landing-beige-dark)] text-[var(--landing-text)]",
  },
};

type LandingCatCardProps = {
  name: string;
  slug: string;
  shelterSlug: string;
  coverUrl: string | null;
  birthDate: Date | null;
  description: string | null;
  locale: string;
  statusLabel: string;
  statusKey: HomepageCatStatusKey;
  className?: string;
  size?: "default" | "compact" | "featured";
};

export function LandingCatCard({
  name,
  slug,
  shelterSlug,
  coverUrl,
  birthDate,
  description,
  locale,
  statusLabel,
  statusKey,
  className,
  size = "default",
}: LandingCatCardProps) {
  const age = formatAnimalAge(birthDate, locale);
  const styles = statusStyles[statusKey];
  const photoRatio =
    size === "featured"
      ? "aspect-[16/10] sm:aspect-[5/3]"
      : size === "compact"
        ? "aspect-[4/5]"
        : "aspect-[3/4]";

  return (
    <Link
      href={`/s/${shelterSlug}/cats/${slug}`}
      className={cn("group block cursor-pointer", className)}
    >
      <article
        className={cn(
          "overflow-hidden rounded-[1.25rem] bg-[var(--landing-card)] shadow-[0_8px_30px_-12px_rgba(58,53,48,0.18)] transition-[transform,box-shadow] duration-300 sm:hover:-translate-y-0.5 sm:hover:shadow-[0_16px_40px_-14px_rgba(58,53,48,0.22)]",
          styles.ring && `ring-1 ${styles.ring}`,
        )}
      >
        <div className={cn("relative overflow-hidden bg-[var(--landing-beige)]", photoRatio)}>
          <AnimalCardImage
            src={coverUrl}
            name={name}
            objectFit="cover"
            className="h-full w-full transition-transform duration-500 sm:group-hover:scale-[1.03]"
          />
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
          <span
            className={cn(
              "absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] rounded-full px-3 py-1.5 text-xs font-semibold leading-tight shadow-sm",
              styles.badge,
            )}
          >
            {statusLabel}
          </span>
        </div>

        <div className={cn("px-4", size === "compact" ? "py-3" : "py-4")}>
          <div className="flex items-baseline justify-between gap-2">
            <h3
              className={cn(
                "font-semibold tracking-tight text-[var(--landing-text)]",
                size === "featured" ? "text-xl sm:text-2xl" : size === "compact" ? "text-base" : "text-lg",
              )}
            >
              {name}
            </h3>
            {age !== "—" && (
              <span className="shrink-0 text-xs text-[var(--landing-muted)]">
                {age}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-[var(--landing-muted)]">
              {description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
