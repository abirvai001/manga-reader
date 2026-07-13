import type { Category, Manga } from "./types";

/** Canonical site origin (no trailing slash). */
export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL;
  if (fromEnv) {
    const withProto = fromEnv.startsWith("http")
      ? fromEnv
      : `https://${fromEnv}`;
    return withProto.replace(/\/$/, "");
  }
  return "https://ymanga.vercel.app";
}

export const SITE_NAME = "YourManga.EN";

export const DEFAULT_KEYWORDS = [
  "manga",
  "read manga online",
  "manga online free",
  "manga reader",
  "webtoon",
  "manhwa",
  "manhua",
  "hentai manga",
  "adult manga",
  "doujinshi",
  "manga PDF",
  "online manga library",
  "YourManga.EN",
] as const;

export const DEFAULT_DESCRIPTION =
  "YourManga.EN — free online manga reader. Read manga, manhwa, manhua, webtoon & adult manga (hentai) online with a smooth vertical scroll and page-turn reader. New titles updated regularly.";

export const DEFAULT_TITLE =
  "YourManga.EN — Read Manga Online Free | Manhwa, Webtoon & Hentai";

/**
 * Build an SEO-friendly description for a manga title when the admin
 * leaves description empty or short.
 */
export function buildMangaSeoDescription(manga: {
  title: string;
  description?: string | null;
  category?: Category | null | string;
}): string {
  const custom = manga.description?.trim();
  if (custom && custom.length >= 80) {
    return custom.length > 160 ? `${custom.slice(0, 157)}…` : custom;
  }

  const genre =
    typeof manga.category === "string"
      ? manga.category
      : manga.category?.name || "manga";

  const base = `Read ${manga.title} online free on YourManga.EN. ${genre} manga with a fast online reader — continuous scroll & page view.`;
  if (custom && custom.length > 0) {
    const merged = `${custom} ${base}`;
    return merged.length > 160 ? `${merged.slice(0, 157)}…` : merged;
  }
  return base.length > 160 ? `${base.slice(0, 157)}…` : base;
}

export function buildMangaSeoTitle(manga: {
  title: string;
  category?: Category | null;
}): string {
  const genre = manga.category?.name;
  if (genre) {
    return `${manga.title} — Read ${genre} Manga Online Free`;
  }
  return `${manga.title} — Read Manga Online Free | YourManga.EN`;
}

/** Suggested description template for admin form (full length for page body). */
export function suggestMangaDescription(title: string, genre?: string): string {
  const g = genre || "manga";
  return (
    `Read ${title} online free on YourManga.EN. This ${g.toLowerCase()} title is available in our online manga reader with smooth vertical (webtoon-style) scrolling and classic page-turn mode. ` +
    `Discover more manga, manhwa, manhua, webtoon, and adult manga (hentai) in our free library. Updated for fans searching for ${title} and similar ${g.toLowerCase()} series.`
  );
}

export function absoluteUrl(path: string): string {
  const base = getSiteUrl();
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function websiteJsonLd() {
  const url = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${url}/browse?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function mangaJsonLd(manga: Manga) {
  const url = absoluteUrl(`/manga/${manga.id}`);
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: manga.title,
    description: buildMangaSeoDescription(manga),
    url,
    image: manga.cover_image_url || undefined,
    genre: manga.category?.name || "Manga",
    inLanguage: "en",
    bookFormat: "https://schema.org/GraphicNovel",
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: getSiteUrl(),
    },
    datePublished: manga.created_at,
  };
}
