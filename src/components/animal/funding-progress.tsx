import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";
import type { AnimalFundingInfo } from "@/lib/animal-funding";
import { formatUah } from "@/lib/animal-funding";

type FundingProgressProps = {
  animalName: string;
  funding: AnimalFundingInfo;
  locale?: string;
  compact?: boolean;
  className?: string;
};

export async function FundingProgress({
  animalName,
  funding,
  locale = "uk",
  compact = false,
  className,
}: FundingProgressProps) {
  if (!funding.hasCurators || funding.fundedPercent == null) {
    return null;
  }

  const t = await getTranslations("payments");

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-warm/25 px-3 py-1 text-sm font-medium text-primary">
          {t("underCuratorship")}
        </span>
        {!compact && funding.monthlyGoal != null && (
          <span className="text-xs text-muted-foreground">
            {formatUah(funding.fundedMonthly, locale)} / {formatUah(funding.monthlyGoal, locale)}
          </span>
        )}
      </div>
      <p className="text-sm text-foreground">
        {t("fundedPercent", { name: animalName, percent: funding.fundedPercent })}
      </p>
      <div className="h-2.5 overflow-hidden rounded-full bg-surface-stone">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${funding.fundedPercent}%` }}
        />
      </div>
    </div>
  );
}
