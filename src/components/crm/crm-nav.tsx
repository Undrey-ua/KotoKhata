"use client";

import { useEffect, useState } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  HandHeart,
  LayoutDashboard,
  Cat,
  ExternalLink,
  Newspaper,
  ClipboardList,
  FileText,
  Syringe,
  Wallet,
  BarChart3,
  Settings,
  Users,
  Menu,
  X,
} from "lucide-react";

type CrmNavProps = {
  shelterSlug: string;
  shelterName: string;
};

type NavLink = {
  href?: string;
  label: string;
  icon: typeof LayoutDashboard;
  match?: (p: string) => boolean;
  enabled: boolean;
};

export function CrmNav({ shelterSlug, shelterName }: CrmNavProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const links: NavLink[] = [
    {
      href: `/crm/${shelterSlug}`,
      label: "Панель",
      icon: LayoutDashboard,
      match: (p: string) => p === `/crm/${shelterSlug}`,
      enabled: true,
    },
    {
      href: `/crm/${shelterSlug}/animals`,
      label: "Котики",
      icon: Cat,
      match: (p: string) => p.startsWith(`/crm/${shelterSlug}/animals`),
      enabled: true,
    },
    {
      href: `/crm/${shelterSlug}/curators`,
      label: "Куратори",
      icon: HandHeart,
      match: (p: string) => p.startsWith(`/crm/${shelterSlug}/curators`),
      enabled: true,
    },
    {
      href: `/crm/${shelterSlug}/volunteers`,
      label: "Волонтери",
      icon: Users,
      match: (p: string) => p.startsWith(`/crm/${shelterSlug}/volunteers`),
      enabled: true,
    },
    { label: "Новини", icon: Newspaper, enabled: false },
    { label: "Заявки", icon: ClipboardList, enabled: false },
    { label: "Звіти", icon: FileText, enabled: false },
    { label: "Вакцинації", icon: Syringe, enabled: false },
    {
      href: `/crm/${shelterSlug}/payments`,
      label: "Фінанси",
      icon: Wallet,
      match: (p: string) => p.startsWith(`/crm/${shelterSlug}/payments`),
      enabled: true,
    },
    { label: "Аналітика", icon: BarChart3, enabled: false },
    { label: "Налаштування", icon: Settings, enabled: false },
  ];

  const enabledLinks = links.filter((item) => item.enabled && item.href);
  const comingSoonLinks = links.filter((item) => !item.enabled || !item.href);

  function renderNavLink(item: NavLink, onNavigate?: () => void) {
    const Icon = item.icon;
    const active = item.href && item.match?.(pathname);

    if (!item.enabled || !item.href) {
      return (
        <span
          key={item.label}
          className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-charcoal-foreground/35"
          title="Скоро"
        >
          <Icon className="h-4 w-4 shrink-0" />
          {item.label}
          <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
            скоро
          </span>
        </span>
      );
    }

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-charcoal-foreground/75 hover:bg-white/10 hover:text-charcoal-foreground",
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-charcoal px-4 py-3 text-charcoal-foreground lg:hidden">
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-wider text-charcoal-foreground/50">
            CRM
          </p>
          <p className="truncate font-semibold">{shelterName}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-charcoal-foreground hover:bg-white/10"
          onClick={() => setMenuOpen(true)}
          aria-label="Відкрити меню"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(100vw-3rem,18rem)] flex-col bg-charcoal text-charcoal-foreground transition-transform duration-200 lg:hidden",
          menuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-charcoal-foreground/50">
              CRM
            </p>
            <p className="truncate font-semibold">{shelterName}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0 text-charcoal-foreground hover:bg-white/10"
            onClick={() => setMenuOpen(false)}
            aria-label="Закрити меню"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
          {enabledLinks.map((item) => renderNavLink(item, () => setMenuOpen(false)))}

          <Link
            href={`/s/${shelterSlug}/cats`}
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-charcoal-foreground/75 hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Сайт
          </Link>

          <div className="my-2 border-t border-white/10 pt-2">
            <p className="px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-charcoal-foreground/40">
              Незабаром
            </p>
            {comingSoonLinks.map((item) => renderNavLink(item))}
          </div>
        </nav>

        <div className="border-t border-white/10 p-3">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full text-charcoal-foreground/75 hover:bg-white/10 hover:text-charcoal-foreground"
            >
              Вийти
            </Button>
          </form>
        </div>
      </aside>

      <aside className="hidden w-60 shrink-0 flex-col bg-charcoal text-charcoal-foreground lg:flex lg:min-h-[calc(100vh-4rem)]">
        <div className="border-b border-white/10 p-4">
          <p className="text-xs font-medium uppercase tracking-wider text-charcoal-foreground/50">
            CRM
          </p>
          <p className="mt-1 font-semibold">{shelterName}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {links.map((item) => renderNavLink(item))}

          <Link
            href={`/s/${shelterSlug}/cats`}
            className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-foreground/75 hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Сайт
          </Link>
        </nav>

        <div className="border-t border-white/10 p-3">
          <form action={logoutAction}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="w-full text-charcoal-foreground/75 hover:bg-white/10 hover:text-charcoal-foreground"
            >
              Вийти
            </Button>
          </form>
        </div>
      </aside>
    </>
  );
}
