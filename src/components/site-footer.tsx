"use client";

import { useTranslations } from "next-intl";

export function SiteFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-charcoal/20 bg-charcoal text-charcoal-foreground">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-10 text-center text-sm text-charcoal-foreground/75 sm:px-6">
        <p>{t("madeWith")}</p>
        <p>
          © {year} KotoXata. {t("rights")}.
        </p>
      </div>
    </footer>
  );
}
