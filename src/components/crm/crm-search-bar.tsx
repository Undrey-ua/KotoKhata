"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type CrmSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
};

export function CrmSearchBar({
  value,
  onChange,
  placeholder = "Пошук…",
  resultCount,
  totalCount,
}: CrmSearchBarProps) {
  const showCount =
    resultCount != null &&
    totalCount != null &&
    value.trim().length > 0 &&
    resultCount !== totalCount;

  return (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="h-10 pl-9"
          aria-label={placeholder}
        />
      </div>
      {showCount && (
        <p className="shrink-0 text-sm text-muted-foreground">
          Знайдено: {resultCount} з {totalCount}
        </p>
      )}
    </div>
  );
}
