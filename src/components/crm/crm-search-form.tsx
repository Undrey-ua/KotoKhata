"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";

type CrmSearchFormProps = {
  defaultValue?: string;
  placeholder?: string;
  totalCount?: number;
};

export function CrmSearchForm({
  defaultValue = "",
  placeholder = "Пошук…",
  totalCount,
}: CrmSearchFormProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const q = String(formData.get("q") ?? "").trim();
    const params = new URLSearchParams(searchParams.toString());

    if (q) {
      params.set("q", q);
    } else {
      params.delete("q");
    }
    params.delete("page");

    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4"
    >
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          name="q"
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="h-10 pl-9"
          aria-label={placeholder}
        />
      </div>
      {totalCount != null && defaultValue.trim() ? (
        <p className="shrink-0 text-sm text-muted-foreground">
          Усього записів: {totalCount}
        </p>
      ) : null}
    </form>
  );
}
