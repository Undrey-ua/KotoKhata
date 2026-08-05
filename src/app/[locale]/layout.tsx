import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { geistMono, geistSans } from "@/lib/fonts";
import { getAppSession } from "@/lib/auth/session";
import { getActiveSponsorships, resolveCuratorHomeHref } from "@/lib/auth/curator";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { routing } from "@/i18n/routing";
import { getMetadataBase } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });

  return {
    metadataBase: getMetadataBase(),
    title: {
      default: t("brand"),
      template: `%s | ${t("brand")}`,
    },
    description: t("tagline"),
    icons: {
      icon: "/brand/logo.png",
      apple: "/brand/logo.png",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "uk" | "en")) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();
  const session = await getAppSession();
  const sponsorships = session
    ? await getActiveSponsorships(session.appUser.id)
    : [];
  const curatorHref = resolveCuratorHomeHref(sponsorships);
  const staffCrmHref =
    session && session.appUser.shelterMemberships.length > 0
      ? `/crm/${session.appUser.shelterMemberships[0]?.shelter.slug ?? "kotoxata"}/animals`
      : null;

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <div className="flex min-h-screen flex-col">
            <SiteHeader
              isLoggedIn={!!session}
              curatorHref={curatorHref}
              staffCrmHref={staffCrmHref}
            />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
