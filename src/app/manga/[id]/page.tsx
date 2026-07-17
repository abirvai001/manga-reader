import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookOpen } from "lucide-react";
import { MangaViewerLoader } from "@/components/viewer/MangaViewerLoader";
import { ViewTracker } from "@/components/manga/ViewTracker";
import { JsonLd } from "@/components/seo/JsonLd";
import { getAdByZone, getMangaById } from "@/lib/data";
import {
  absoluteUrl,
  buildMangaSeoDescription,
  buildMangaSeoTitle,
  mangaJsonLd,
} from "@/lib/seo";

interface MangaPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ view?: string }>;
}

export async function generateMetadata({
  params,
}: MangaPageProps): Promise<Metadata> {
  const { id } = await params;
  const manga = await getMangaById(id);
  if (!manga) {
    return { title: "Manga not found" };
  }

  const title = buildMangaSeoTitle(manga);
  const description = buildMangaSeoDescription(manga);
  const url = absoluteUrl(`/manga/${manga.id}`);

  return {
    title,
    description,
    keywords: [
      manga.title,
      "read manga online",
      "manga free",
      manga.category?.name || "manga",
      "manhwa",
      "webtoon",
      "hentai manga",
      "YourManga.EN",
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "book",
      title,
      description,
      url,
      siteName: "YourManga.EN",
      images: manga.cover_image_url
        ? [{ url: manga.cover_image_url, alt: manga.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: manga.cover_image_url ? [manga.cover_image_url] : undefined,
    },
  };
}

export default async function MangaReaderPage({
  params,
  searchParams,
}: MangaPageProps) {
  const { id } = await params;
  const { view } = await searchParams;
  const startReading = view === "read";

  const [manga, topAd, bottomAd, inlineAd] = await Promise.all([
    getMangaById(id),
    getAdByZone("viewer_top"),
    getAdByZone("viewer_bottom"),
    getAdByZone("viewer_inline"),
  ]);

  if (!manga) notFound();

  const seoDescription = buildMangaSeoDescription(manga);
  const fullBody =
    manga.description?.trim() ||
    `Read ${manga.title} online free on YourManga.EN. ${
      manga.category?.name || "Manga"
    } series available in our free online manga reader.`;

  // Full reader (after user clicks Read)
  if (startReading) {
    return (
      <>
        <JsonLd data={mangaJsonLd(manga)} />
        {/* Count a view when someone actually opens the reader */}
        <ViewTracker
          mangaId={manga.id}
          initialViews={manga.views ?? 0}
          track
          className="sr-only"
        />
        {/* Crawlable text for bots even on reader view */}
        <article className="sr-only">
          <h1>{manga.title} — read manga online free</h1>
          <p>{fullBody}</p>
          <p>{seoDescription}</p>
        </article>
        <MangaViewerLoader
          title={manga.title}
          pdfUrl={manga.pdf_file_url}
          topAd={topAd}
          bottomAd={bottomAd}
          inlineAd={inlineAd}
        />
      </>
    );
  }

  // SEO landing page (default) — Google indexes title, description, cover
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <JsonLd data={mangaJsonLd(manga)} />

      <nav className="mb-6 text-sm text-zinc-500">
        <Link href="/" className="hover:text-violet-400">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/browse" className="hover:text-violet-400">
          Manga
        </Link>
        {manga.category && (
          <>
            <span className="mx-2">/</span>
            <Link
              href={`/browse?category=${manga.category.slug}`}
              className="hover:text-violet-400"
            >
              {manga.category.name}
            </Link>
          </>
        )}
        <span className="mx-2">/</span>
        <span className="text-zinc-400">{manga.title}</span>
      </nav>

      <article className="flex flex-col gap-8 sm:flex-row">
        <div className="relative mx-auto h-80 w-52 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl sm:mx-0">
          {manga.cover_image_url ? (
            <Image
              src={manga.cover_image_url}
              alt={`${manga.title} manga cover — read online free on YourManga.EN`}
              fill
              className="object-cover"
              sizes="208px"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-zinc-600">
              No cover
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-violet-400">
            Free online manga
            {manga.category ? ` · ${manga.category.name}` : ""}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {manga.title}
          </h1>
          <div className="mt-3">
            <ViewTracker
              mangaId={manga.id}
              initialViews={manga.views ?? 0}
              track={false}
              className="text-sm text-zinc-400"
            />
          </div>
          <p className="mt-4 text-base leading-relaxed text-zinc-400">
            {fullBody}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-zinc-500">
            Read <strong className="text-zinc-300">{manga.title}</strong> online
            free with our manga reader. Supports vertical scroll (webtoon style)
            and page-turn mode. More free manga, manhwa, webtoon, and adult
            manga (hentai) on{" "}
            <Link href="/" className="text-violet-400 hover:underline">
              YourManga.EN
            </Link>
            .
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={`/manga/${manga.id}?view=read`}
              className="inline-flex items-center gap-2 rounded-full bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/30 transition hover:bg-violet-500"
            >
              <BookOpen className="h-4 w-4" />
              Read {manga.title} online
            </Link>
            <Link
              href="/browse"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              More free manga
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
