import { Link } from "@/i18n/navigation";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import type { HomepageCatSpotlight } from "@/lib/shelter-stats";
import { cn } from "@/lib/utils";

type HomepageSpotlightCatsProps = {
  shelterSlug: string;
  latestNew: HomepageCatSpotlight | null;
  latestAdopted: HomepageCatSpotlight | null;
  newcomerBadge: string;
  adoptedBadge: string;
  newcomerCaption: string;
  adoptedCaption: string;
  placeholder: string;
};

function SpotlightCard({
  cat,
  href,
  badge,
  badgeClassName,
  caption,
  placeholder,
}: {
  cat: HomepageCatSpotlight | null;
  href: string;
  badge: string;
  badgeClassName: string;
  caption: string;
  placeholder: string;
}) {
  if (!cat) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border-cool bg-card shadow-sm">
        <div className="flex aspect-[3/4] items-center justify-center bg-surface-cool p-6 text-center text-sm text-muted-foreground">
          {placeholder}
        </div>
      </div>
    );
  }

  return (
    <Link href={href} className="block cursor-pointer">
      <article className="group overflow-hidden rounded-2xl border border-border-cool bg-card shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-[3/4] overflow-hidden bg-surface-stone">
          <AnimalCardImage
            src={cat.imageUrl}
            name={cat.name}
            objectFit="cover"
            className="h-full w-full transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/50 to-transparent" />
          <span
            className={cn(
              "absolute bottom-2 left-2 rounded-md px-2 py-1 text-[11px] font-medium leading-none text-white",
              badgeClassName,
            )}
          >
            {badge}
          </span>
        </div>
        <div className="border-t border-border-cool px-4 py-3">
          <p className="font-semibold text-foreground">{cat.name}</p>
          <p className="text-sm text-muted-foreground">{caption}</p>
        </div>
      </article>
    </Link>
  );
}

export function HomepageSpotlightCats({
  shelterSlug,
  latestNew,
  latestAdopted,
  newcomerBadge,
  adoptedBadge,
  newcomerCaption,
  adoptedCaption,
  placeholder,
}: HomepageSpotlightCatsProps) {
  const hasAny = latestNew || latestAdopted;

  if (!hasAny) {
    return (
      <div className="flex aspect-[3/4] flex-col items-center justify-center gap-3 rounded-2xl border border-border-cool bg-surface-cool p-8 text-center">
        <p className="text-sm text-muted-foreground">{placeholder}</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <SpotlightCard
        cat={latestNew}
        href={`/s/${shelterSlug}/cats/${latestNew?.slug ?? ""}`}
        badge={newcomerBadge}
        badgeClassName="bg-primary/95"
        caption={newcomerCaption}
        placeholder={placeholder}
      />
      <SpotlightCard
        cat={latestAdopted}
        href={`/s/${shelterSlug}/cats/${latestAdopted?.slug ?? ""}`}
        badge={adoptedBadge}
        badgeClassName="bg-emerald-600/95"
        caption={adoptedCaption}
        placeholder={placeholder}
      />
    </div>
  );
}
