import type { MetadataRoute } from "next";
import { DEFAULT_BASE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || DEFAULT_BASE_URL;

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/", "/workspaces", "/api/", "/auth/", "/signin"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
