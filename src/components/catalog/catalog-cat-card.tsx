import { Link } from "@/i18n/navigation";
import type { AnimalSex, AnimalStatus } from "@prisma/client";
import { AnimalCardImage } from "@/components/shared/animal-card-image";
import { sexLabels, isAdopted } from "@/lib/animal-labels";
import type { AnimalFundingInfo } from "@/lib/animal-funding";
import { cn } from "@/lib/utils";

const sexIcon: Record<AnimalSex, string> = {
  MALE: "♂",
  FEMALE: "♀",
  UNKNOWN: "",
};

type CatalogCatCardProps = {
  name: string;
  slug: string;
  sex: AnimalSex;
  status: AnimalStatus;
  description: string | null;
  coverUrl: string | null;
  shelterSlug: string;
  funding: AnimalFundingInfo;
  adoptedLabel: string;
  fundedShortLabel?: string;
};

export function CatalogCatCard({
  name,
  slug,
  sex,
  status,
  description,
  coverUrl,
  shelterSlug,
  funding,
  adoptedLabel,
  fundedShortLabel,
}: CatalogCatCardProps) {
  const underCuratorship = funding.hasCurators && funding.fundedPercent != null;
  const adopted = isAdopted(status);

  return (
    <Link href={`/s/${shelterSlug}/cats/${slug}`} className="block h-full cursor-pointer">
      <article
        className={cn(
          "group flex h-full flex-col overflow-hidden rounded-xl border border-border-cool/70 bg-card",
          "shadow-sm transition-shadow duration-200 hover:border-primary/25 hover:shadow-md",
        )}
      >
        <div className="relative aspect-[3/4] shrink-0 overflow-hidden bg-surface-stone">
          <AnimalCardImage
            src={coverUrl}
            name={name}
            objectFit="cover"
            className="h-full w-full transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {(adopted || (underCuratorship && !adopted)) && (
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/45 to-transparent" />
          )}
          {adopted && (
            <span className="absolute bottom-1.5 left-1.5 rounded-md bg-emerald-600/95 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
              {adoptedLabel}
            </span>
          )}
          {underCuratorship && !adopted && (
            <span className="absolute bottom-1.5 left-1.5 max-w-[calc(100%-0.75rem)] truncate rounded-md bg-primary/95 px-1.5 py-0.5 text-[10px] font-medium leading-none text-primary-foreground">
              {funding.fundedPercent}%
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-2 sm:p-2.5">
          <div className="flex min-w-0 items-center gap-1">
            <h2 className="truncate text-sm font-semibold text-foreground">{name}</h2>
            {sexIcon[sex] && (
              <span className="shrink-0 text-xs text-primary" aria-hidden>
                {sexIcon[sex]}
              </span>
            )}
            <span className="sr-only">{sexLabels[sex]}</span>
          </div>

          {underCuratorship && (
            <div className="mt-1.5">
              <div className="h-1 overflow-hidden rounded-full bg-surface-stone">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${funding.fundedPercent}%` }}
                />
              </div>
              {fundedShortLabel && (
                <p className="mt-1 truncate text-[10px] text-muted-foreground">
                  {fundedShortLabel}
                </p>
              )}
            </div>
          )}

          {description && (
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted-foreground sm:text-xs">
              {description}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
