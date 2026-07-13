export type PlacementZone =
  | "homepage_top"
  | "homepage_bottom"
  | "sidebar"
  | "listing_top"
  | "viewer_top"
  | "viewer_bottom"
  | "viewer_inline";

export const PLACEMENT_ZONES: { value: PlacementZone; label: string }[] = [
  { value: "homepage_top", label: "Homepage — Top Header" },
  { value: "homepage_bottom", label: "Homepage — Footer Banner" },
  { value: "sidebar", label: "Sidebar (listing pages)" },
  { value: "listing_top", label: "Listing / Browse — Top" },
  { value: "viewer_top", label: "Reader — Sticky Top" },
  { value: "viewer_bottom", label: "Reader — Sticky Bottom" },
  { value: "viewer_inline", label: "Reader — Between Pages" },
];

export interface Category {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Manga {
  id: string;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  pdf_file_url: string;
  category_id: string | null;
  is_published?: boolean;
  created_at: string;
  updated_at?: string;
  category?: Category | null;
}

export interface AdBanner {
  id: string;
  banner_image_url: string;
  placement_zone: PlacementZone;
  target_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export type ReadingMode = "vertical" | "single" | "double";
