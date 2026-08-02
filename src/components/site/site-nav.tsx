"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const SHELTER_SLUG = "kotoxata";

type NavLink = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

export function SiteNav() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const links: NavLink[] = [
    {
      href: "/",
      label: t("home"),
      match: (p) => p === "/",
    },
    {
      href: `/s/${SHELTER_SLUG}/cats`,
      label: t("cats"),
      match: (p) => p.startsWith(`/s/${SHELTER_SLUG}/cats`),
    },
    {
      href: "/#help",
      label: t("help"),
      match: () => false,
    },
    {
      href: `/s/${SHELTER_SLUG}`,
      label: t("about"),
      match: (p) => p === `/s/${SHELTER_SLUG}`,
    },
    {
      href: "/telegram",
      label: t("telegram"),
      match: (p) => p.startsWith("/telegram"),
    },
  ];

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {links.map(({ href, label, match }) => {
        const active = match(pathname);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-surface-stone hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
