"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BrandLogo } from "@/components/brand-logo";
import { SiteNav } from "@/components/site/site-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { Button } from "@/components/ui/button";

type SiteHeaderProps = {
  isLoggedIn?: boolean;
  curatorHref?: string | null;
  staffCrmHref?: string | null;
};

export function SiteHeader({ isLoggedIn, curatorHref, staffCrmHref }: SiteHeaderProps) {
  const t = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <header className="sticky top-0 z-50 border-b border-border-cool/80 bg-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <BrandLogo size={40} />
          <div className="hidden sm:block">
            <p className="font-semibold leading-tight tracking-wide text-foreground">
              {t("brand")}
            </p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("tagline")}
            </p>
          </div>
        </Link>

        <div className="flex flex-1 justify-center">
          <SiteNav />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LocaleSwitcher />
          <Button size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/s/kotoxata/cats">{tn("support")}</Link>
          </Button>
          {isLoggedIn ? (
            <>
              {curatorHref && (
                <Button variant="accent" size="sm" asChild>
                  <Link href={curatorHref}>{tn("myWard")}</Link>
                </Button>
              )}
              {staffCrmHref && (
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                  <Link href={staffCrmHref}>{tn("crm")}</Link>
                </Button>
              )}
            </>
          ) : (
            <Button variant="outline" size="sm" asChild>
              <Link href="/login">{tn("curatorLogin")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
