import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import { DEMO_STORE_SLUG } from "@/lib/demo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/${DEMO_STORE_SLUG}`,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];
  return entries;
}
