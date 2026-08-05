import type { MetadataRoute } from "next";
import { getAppUrl } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/crm/",
        "/my/",
        "/login",
        "/register",
        "/staff/",
        "/auth/",
        "/api/",
      ],
    },
    sitemap: `${getAppUrl()}/sitemap.xml`,
  };
}
