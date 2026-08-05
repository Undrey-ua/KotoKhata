import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { prisma } from "@/lib/db/prisma";
import { getAppUrl } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();

  const [shelters, animals] = await Promise.all([
    prisma.shelter.findMany({
      select: { slug: true, updatedAt: true },
    }),
    prisma.animal.findMany({
      where: { isPublic: true },
      select: {
        slug: true,
        updatedAt: true,
        shelter: { select: { slug: true } },
      },
    }),
  ]);

  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    entries.push({
      url: `${baseUrl}/${locale}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    });

    entries.push({
      url: `${baseUrl}/${locale}/telegram`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    });

    for (const shelter of shelters) {
      entries.push({
        url: `${baseUrl}/${locale}/s/${shelter.slug}`,
        lastModified: shelter.updatedAt,
        changeFrequency: "monthly",
        priority: 0.8,
      });

      entries.push({
        url: `${baseUrl}/${locale}/s/${shelter.slug}/cats`,
        lastModified: shelter.updatedAt,
        changeFrequency: "daily",
        priority: 0.9,
      });
    }

    for (const animal of animals) {
      entries.push({
        url: `${baseUrl}/${locale}/s/${animal.shelter.slug}/cats/${animal.slug}`,
        lastModified: animal.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  }

  return entries;
}
