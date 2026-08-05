"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const SHELTER_SLUG = "kotoxata";

type NavLink = {
  href: string;
  label: string;
  match: (pathname: string) => boolean;
};

function useSiteNavLinks(): NavLink[] {
  const t = useTranslations("nav");

  return [
    {
      href: "/",
      label: t("home"),
      match: (p) => p === "/",
    },
    {
      href: `/s/${SHELTER_SLUG}/cats`,
      label: t("cats"),
      match: (p) =>
        p.startsWith(`/s/${SHELTER_SLUG}/cats`) &&
        !p.startsWith(`/s/${SHELTER_SLUG}/life`),
    },
    {
      href: `/s/${SHELTER_SLUG}/life`,
      label: t("life"),
      match: (p) => p.startsWith(`/s/${SHELTER_SLUG}/life`),
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
}

function navLinkClassName(active: boolean, className?: string) {
  return cn(
    "whitespace-nowrap rounded-md px-2.5 py-2 text-sm font-medium transition-colors xl:px-3",
    active
      ? "text-foreground"
      : "text-muted-foreground hover:text-foreground",
    className,
  );
}

type NavLinksProps = {
  links: NavLink[];
  pathname: string;
  onNavigate?: () => void;
  linkClassName?: string;
};

function NavLinks({
  links,
  pathname,
  onNavigate,
  linkClassName,
}: NavLinksProps) {
  return links.map(({ href, label, match }) => {
    const active = match(pathname);

    return (
      <Link
        key={href}
        href={href}
        onClick={onNavigate}
        className={navLinkClassName(active, cn(linkClassName, active && "relative"))}
      >
        {label}
        {active && (
          <span className="absolute inset-x-2.5 -bottom-0.5 h-0.5 rounded-full bg-primary xl:inset-x-3" />
        )}
      </Link>
    );
  });
}

export function SiteNavDesktop() {
  const pathname = usePathname();
  const links = useSiteNavLinks();

  return (
    <nav className="hidden items-center gap-0.5 lg:flex">
      <NavLinks links={links} pathname={pathname} linkClassName="relative" />
    </nav>
  );
}

export function SiteNavMobile() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const links = useSiteNavLinks();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const drawer =
    mounted && open
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
              onClick={() => setOpen(false)}
              aria-hidden
            />
            <aside className="fixed inset-y-0 right-0 z-[70] flex w-[min(100vw-3rem,18rem)] flex-col border-l border-border-cool/80 bg-card shadow-xl lg:hidden">
              <div className="flex items-center justify-between border-b border-border-cool/80 px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{t("menu")}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  aria-label={t("closeMenu")}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
                <NavLinks
                  links={links}
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                  linkClassName="block rounded-lg px-3 py-2.5 hover:bg-surface-stone"
                />
              </nav>
            </aside>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 lg:hidden"
        onClick={() => setOpen(true)}
        aria-label={t("openMenu")}
      >
        <Menu className="h-5 w-5" />
      </Button>
      {drawer}
    </>
  );
}
