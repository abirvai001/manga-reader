import type { Metadata } from "next";
import Link from "next/link";
import { AdBannerStatic } from "@/components/ads/AdBanner";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { getAdByZone, getCategories, getMangaList } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Browse Manga Online Free — Manhwa, Webtoon & Hentai",
  description:
    "Browse free manga online on YourManga.EN. Filter by genre: action, romance, fantasy, comedy, horror, and adult manga (hentai). Read manhwa & webtoon in your browser.",
  alternates: { canonical: absoluteUrl("/browse") },
  openGraph: {
    title: "Browse Manga Online Free | YourManga.EN",
    description:
      "Explore free manga, manhwa, webtoon and adult manga online. Filter by category and start reading instantly.",
    url: absoluteUrl("/browse"),
  },
};

interface BrowsePageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const [manga, categories, listingAd, sidebarAd] = await Promise.all([
    getMangaList({
      search: params.q,
      categorySlug: params.category,
    }),
    getCategories(),
    getAdByZone("listing_top"),
    getAdByZone("sidebar"),
  ]);

  const heading = params.q
    ? `Manga search: “${params.q}”`
    : params.category
      ? `${params.category.charAt(0).toUpperCase()}${params.category.slice(1)} manga online`
      : "Browse free manga online";

  const sub = params.q
    ? `Search results for manga related to “${params.q}” on YourManga.EN`
    : params.category
      ? `Read free ${params.category} manga, manhwa & webtoon online`
      : "All free manga, manhwa, manhua, webtoon & adult manga titles";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{heading}</h1>
        <p className="mt-1 text-sm text-zinc-500">{sub}</p>
      </div>

      <div className="mb-6">
        <AdBannerStatic ad={listingAd} maxHeight={90} />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap gap-2">
            <Link
              href="/browse"
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm transition",
                !params.category
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              All manga
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/browse?category=${cat.slug}`}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-sm transition",
                  params.category === cat.slug
                    ? "bg-violet-600 text-white"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <MangaGrid
            manga={manga}
            emptyMessage="No manga match your filters. Try another category or search term."
          />
        </div>

        <aside className="w-full shrink-0 lg:w-64">
          <div className="sticky top-24 space-y-4">
            {sidebarAd ? (
              <div className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/50 p-2">
                <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-wider text-zinc-600">
                  Sponsored
                </p>
                <AdBannerStatic ad={sidebarAd} maxHeight={250} />
              </div>
            ) : null}
            <div className="rounded-2xl border border-white/5 bg-zinc-900/40 p-4">
              <h2 className="text-sm font-semibold text-white">
                Why read on YourManga.EN?
              </h2>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-zinc-500">
                <li>Free online manga reader — no install.</li>
                <li>Webtoon-style scroll or classic page turn.</li>
                <li>Manga, manhwa, webtoon &amp; adult titles.</li>
                <li>
                  Sponsorship:{" "}
                  <a
                    href="mailto:abirodroid.admob@gmail.com"
                    className="text-violet-400"
                  >
                    abirodroid.admob@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
