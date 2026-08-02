"use client";

import { useTransition } from "react";
import { CuratorRelationshipStatus } from "@prisma/client";
import { useRouter } from "@/i18n/navigation";
import { updateCuratorStatusAction } from "@/actions/curators";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { curatorRelationshipLabels } from "@/lib/crm/curator-labels";

type CuratorStatusSelectProps = {
  shelterSlug: string;
  sponsorshipId: string;
  value: CuratorRelationshipStatus;
  compact?: boolean;
};

export function CuratorStatusSelect({
  shelterSlug,
  sponsorshipId,
  value,
  compact = false,
}: CuratorStatusSelectProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onChange(next: string) {
    startTransition(async () => {
      const result = await updateCuratorStatusAction(
        shelterSlug,
        sponsorshipId,
        next as CuratorRelationshipStatus,
      );
      if (!result?.error) {
        router.refresh();
      }
    });
  }

  return (
    <Select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={pending}
      className={cn(compact ? "h-8 min-w-[140px] text-xs" : "max-w-xs")}
      aria-label="Статус куратора"
    >
      {(Object.keys(curatorRelationshipLabels) as CuratorRelationshipStatus[]).map(
        (status) => (
          <option key={status} value={status}>
            {curatorRelationshipLabels[status]}
          </option>
        ),
      )}
    </Select>
  );
}

export function StatusBadge({
  label,
  className,
}: {
  label: string;
  className: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function ActionHint({ children }: { children: ReactNode }) {
  return <p className="max-w-[200px] text-xs leading-snug text-muted-foreground">{children}</p>;
}
