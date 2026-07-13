import type { MetadataRoute } from "next";
import { getMangaList } from "@/lib/data";
import { absoluteUrl, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

/**
 * Google-friendly sitemap.
 * - No query-string URLs (GSC often rejects / fails to parse them)
 * - Always returns at least core pages if DB is slow/down
 * - Absolute https URLs on the canonical host only
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const host = getSiteUrl();

  const core: MetadataRoute.Sitemap = [
    {
      url: `${host}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/browse"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const manga = await getMangaList({ limit: 5000 });
    const mangaRoutes: MetadataRoute.Sitemap = manga
      .filter((m) => m?.id)
      .map((m) => ({
        url: absoluteUrl(`/manga/${m.id}`),
        lastModified: m.updated_at
          ? new Date(m.updated_at)
          : new Date(m.created_at || now),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));

    return [...core, ...mangaRoutes];
  } catch {
    // Never fail the sitemap response — Google needs a valid XML every time
    return core;
  }
}
