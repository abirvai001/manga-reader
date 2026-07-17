import type { AdBanner, Category, Manga } from "./types";

export const mockCategories: Category[] = [
  {
    id: "cat-1",
    name: "Action",
    slug: "action",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-2",
    name: "Romance",
    slug: "romance",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-3",
    name: "Fantasy",
    slug: "fantasy",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-4",
    name: "Comedy",
    slug: "comedy",
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "cat-5",
    name: "Horror",
    slug: "horror",
    created_at: "2026-01-01T00:00:00Z",
  },
];

/** Sample public-domain style PDF for demo reading (Mozilla PDF.js sample). */
const DEMO_PDF =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

export const mockManga: Manga[] = [
  {
    id: "manga-1",
    title: "Shadow Blade Chronicles",
    description:
      "A rogue swordsman battles ancient demons across a broken empire. High-octane action with intricate world-building.",
    cover_image_url:
      "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=600&fit=crop",
    pdf_file_url: DEMO_PDF,
    category_id: "cat-1",
    views: 12840,
    created_at: "2026-03-15T10:00:00Z",
    category: mockCategories[0],
  },
  {
    id: "manga-2",
    title: "Moonlit Confession",
    description:
      "Two rivals at an elite academy discover feelings neither expected. Soft romance with slice-of-life charm.",
    cover_image_url:
      "https://images.unsplash.com/photo-1618519764620-7403abdbdfe9?w=400&h=600&fit=crop",
    pdf_file_url: DEMO_PDF,
    category_id: "cat-2",
    views: 9321,
    created_at: "2026-04-02T14:30:00Z",
    category: mockCategories[1],
  },
  {
    id: "manga-3",
    title: "Crystal Realm Odyssey",
    description:
      "A young mage awakens powers that could rewrite the crystal realms — or shatter them forever.",
    cover_image_url:
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=600&fit=crop",
    pdf_file_url: DEMO_PDF,
    category_id: "cat-3",
    views: 15402,
    created_at: "2026-02-20T09:15:00Z",
    category: mockCategories[2],
  },
  {
    id: "manga-4",
    title: "Office Chaos Squad",
    description:
      "A misfit team of office workers turns every deadline into an absurd adventure. Pure comedy gold.",
    cover_image_url:
      "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=600&fit=crop",
    pdf_file_url: DEMO_PDF,
    category_id: "cat-4",
    views: 4102,
    created_at: "2026-05-10T16:00:00Z",
    category: mockCategories[3],
  },
  {
    id: "manga-5",
    title: "Whispers of the Hollow",
    description:
      "Something lives in the abandoned subway tunnels. A horror thriller that will keep you up at night.",
    cover_image_url:
      "https://images.unsplash.com/photo-1509248961158-e54f6934749c?w=400&h=600&fit=crop",
    pdf_file_url: DEMO_PDF,
    category_id: "cat-5",
    views: 7200,
    created_at: "2026-01-28T20:00:00Z",
    category: mockCategories[4],
  },
  {
    id: "manga-6",
    title: "Neon Drift Racers",
    description:
      "Illegal skyway races, cyber-boosted bikes, and a championship that could free an entire district.",
    cover_image_url:
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=600&fit=crop",
    pdf_file_url: DEMO_PDF,
    category_id: "cat-1",
    views: 21050,
    created_at: "2026-06-01T11:00:00Z",
    category: mockCategories[0],
  },
];

const AD_PLACEHOLDER = (label: string, color: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="728" height="90" viewBox="0 0 728 90">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${color}"/>
          <stop offset="100%" style="stop-color:${color}dd"/>
        </linearGradient>
      </defs>
      <rect width="728" height="90" fill="url(#g)" rx="8"/>
      <text x="364" y="52" font-family="system-ui,sans-serif" font-size="20" font-weight="600" fill="white" text-anchor="middle">${label}</text>
    </svg>`
  )}`;

export const mockAds: AdBanner[] = [
  {
    id: "ad-1",
    banner_image_url: AD_PLACEHOLDER("★ Homepage Top Ad — Click Me!", "#7c3aed"),
    placement_zone: "homepage_top",
    target_url: "https://example.com/promo",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "ad-2",
    banner_image_url: AD_PLACEHOLDER("Homepage Footer Sponsor", "#2563eb"),
    placement_zone: "homepage_bottom",
    target_url: "https://example.com/sponsor",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "ad-3",
    banner_image_url: AD_PLACEHOLDER("Sidebar Promo", "#059669"),
    placement_zone: "sidebar",
    target_url: "https://example.com/sidebar",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "ad-4",
    banner_image_url: AD_PLACEHOLDER("Browse Listing Banner", "#dc2626"),
    placement_zone: "listing_top",
    target_url: "https://example.com/browse",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "ad-5",
    banner_image_url: AD_PLACEHOLDER("Reader Sticky Top Ad", "#ea580c"),
    placement_zone: "viewer_top",
    target_url: "https://example.com/reader-top",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "ad-6",
    banner_image_url: AD_PLACEHOLDER("Reader Sticky Bottom Ad", "#db2777"),
    placement_zone: "viewer_bottom",
    target_url: "https://example.com/reader-bottom",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "ad-7",
    banner_image_url: AD_PLACEHOLDER("✦ Sponsored • Between Chapters ✦", "#4f46e5"),
    placement_zone: "viewer_inline",
    target_url: "https://example.com/inline",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];
