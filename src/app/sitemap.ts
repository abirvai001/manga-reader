import type { MetadataRoute } from "next";
import { getMangaList, getCategories } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [manga, categories] = await Promise.all([
    getMangaList({ limit: 5000 }),
    getCategories(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/browse"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: absoluteUrl(`/browse?category=${c.slug}`),
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const mangaRoutes: MetadataRoute.Sitemap = manga.map((m) => ({
    url: absoluteUrl(`/manga/${m.id}`),
    lastModified: m.updated_at ? new Date(m.updated_at) : new Date(m.created_at),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...mangaRoutes];
}
