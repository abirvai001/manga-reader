import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { AdBannerStatic } from "@/components/ads/AdBanner";
import { MangaGrid } from "@/components/manga/MangaGrid";
import { getAdByZone, getCategories, getMangaList } from "@/lib/data";
import { isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [manga, categories, topAd, bottomAd] = await Promise.all([
    getMangaList({ limit: 12 }),
    getCategories(),
    getAdByZone("homepage_top"),
    getAdByZone("homepage_bottom"),
  ]);

  return (
    <div className="pb-16">
      <section className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/40 via-zinc-950 to-zinc-950" />
        <div className="pointer-events-none absolute -left-32 top-20 h-72 w-72 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-violet-600/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-medium text-violet-300">
            <Sparkles className="h-3.5 w-3.5" />
            YourManga.EN
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              YourManga.EN
            </span>
          </h1>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500"
            >
              Browse library
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isDemoMode() && (
            <p className="mt-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90">
              Running in <strong>demo mode</strong> with sample data.
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <AdBannerStatic ad={topAd} maxHeight={90} />
      </div>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <h2 className="text-lg font-semibold text-white">Categories</h2>
          <Link
            href="/browse"
            className="text-sm text-violet-400 hover:text-violet-300"
          >
            View all
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/browse?category=${cat.slug}`}
              className="rounded-full border border-white/10 bg-zinc-900 px-4 py-2 text-sm text-zinc-300 transition hover:border-violet-500/40 hover:bg-violet-500/10 hover:text-white"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Latest titles</h2>
            <p className="mt-1 text-sm text-zinc-500">
              Tap a cover to open the custom reader
            </p>
          </div>
        </div>
        <MangaGrid manga={manga} />
      </section>

      <div className="mx-auto mt-12 max-w-7xl px-4 sm:px-6">
        <AdBannerStatic ad={bottomAd} maxHeight={90} />
      </div>
    </div>
  );
}
