import Link from "next/link";
import { AdBannerStatic } from "@/components/ads/AdBanner";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { getAdByZone, getCategories, getMangaList } from "@/lib/data";
import { cn } from "@/lib/utils";

export const metadata = {
  title: "Browse",
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white sm:text-3xl">Browse</h1>
        <p className="mt-1 text-sm text-zinc-500">
          {params.q
            ? `Results for “${params.q}”`
            : params.category
              ? `Category: ${params.category}`
              : "All titles in the library"}
        </p>
      </div>

      <div className="mb-6">
        <AdBannerStatic ad={listingAd} maxHeight={90} />
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        {/* Main grid */}
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
              All
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
            emptyMessage="No titles match your filters. Try another category or search."
          />
        </div>

        {/* Sidebar ads — collapses if empty */}
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
              <h3 className="text-sm font-semibold text-white">Tips</h3>
              <ul className="mt-2 space-y-2 text-xs leading-relaxed text-zinc-500">
                <li>Open any title for Webtoon scroll or page-turn reading.</li>
                <li>Ads between pages appear every 5 pages in vertical mode.</li>
                <li>Admin can upload PDFs, covers, and GIF/PNG banners.</li>
              </ul>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
