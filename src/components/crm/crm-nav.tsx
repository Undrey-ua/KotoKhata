"use client";

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
} from "lucide-react";

type CrmNavProps = {
  shelterSlug: string;
  shelterName: string;
};

export function CrmNav({ shelterSlug, shelterName }: CrmNavProps) {
  const pathname = usePathname();

  const links = [
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

  return (
    <aside className="flex w-full flex-col bg-charcoal text-charcoal-foreground lg:w-60 lg:min-h-[calc(100vh-4rem)]">
      <div className="border-b border-white/10 p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-charcoal-foreground/50">
          CRM
        </p>
        <p className="mt-1 font-semibold">{shelterName}</p>
      </div>

      <nav className="flex flex-1 gap-1 overflow-x-auto p-2 lg:flex-col lg:overflow-visible">
        {links.map((item) => {
          const Icon = item.icon;
          const active = item.href && item.match?.(pathname);

          if (!item.enabled || !item.href) {
            return (
              <span
                key={item.label}
                className="flex cursor-not-allowed items-center gap-2 rounded-lg px-3 py-2 text-sm text-charcoal-foreground/35"
                title="Скоро"
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
                <span className="ml-auto hidden rounded bg-white/10 px-1.5 py-0.5 text-[10px] lg:inline">
                  скоро
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-charcoal-foreground/75 hover:bg-white/10 hover:text-charcoal-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}

        <Link
          href={`/s/${shelterSlug}/cats`}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-charcoal-foreground/75 hover:bg-white/10 lg:mt-2"
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Сайт
        </Link>
      </nav>

      <div className="hidden border-t border-white/10 p-3 lg:block">
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
  );
}
