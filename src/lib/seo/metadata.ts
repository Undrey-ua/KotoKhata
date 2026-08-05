import type { Metadata } from "next";
import { defaultLocale, locales } from "@/i18n/config";
import { getAppUrl } from "@/lib/env";

export function getMetadataBase(): URL {
  return new URL(getAppUrl());
}

export function buildLocalePath(locale: string, pathname: string): string {
  const path = pathname.startsWith("/") ? pathname : `/${pathname}`;
  if (path === "/") {
    return `/${locale}`;
  }
  return `/${locale}${path}`;
}

export function buildAbsoluteUrl(locale: string, pathname: string): string {
  return new URL(buildLocalePath(locale, pathname), getMetadataBase()).toString();
}

export function buildLanguageAlternates(pathname: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = buildAbsoluteUrl(locale, pathname);
  }
  languages["x-default"] = buildAbsoluteUrl(defaultLocale, pathname);
  return languages;
}

function toAbsoluteImageUrl(image: string): string {
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return new URL(image.startsWith("/") ? image : `/${image}`, getMetadataBase()).toString();
}

type PageMetadataInput = {
  locale: string;
  pathname: string;
  title: string;
  description: string;
  images?: string[];
  noIndex?: boolean;
  type?: "website" | "article";
};

export function buildPageMetadata({
  locale,
  pathname,
  title,
  description,
  images = ["/brand/logo.png"],
  noIndex = false,
  type = "website",
}: PageMetadataInput): Metadata {
  const url = buildAbsoluteUrl(locale, pathname);
  const absoluteImages = images.map(toAbsoluteImageUrl);

  return {
    title,
    description,
    alternates: {
      canonical: url,
      languages: buildLanguageAlternates(pathname),
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "KotoXata",
      locale: locale === "uk" ? "uk_UA" : "en_US",
      type,
      images: absoluteImages.map((imageUrl) => ({ url: imageUrl })),
    },
    twitter: {
      card: absoluteImages.length > 0 ? "summary_large_image" : "summary",
      title,
      description,
      images: absoluteImages,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
  };
}

export function privatePageMetadata(): Metadata {
  return { robots: { index: false, follow: false } };
}
