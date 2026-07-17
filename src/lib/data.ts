import { mockAds, mockCategories, mockManga } from "./mock-data";
import type { AdBanner, Category, Manga, PlacementZone } from "./types";
import { hasSupabaseEnv, isDemoMode } from "./env";
import { logger } from "./logger";

async function getSupabase() {
  const { createClient } = await import("./supabase/server");
  return createClient();
}

function useMock(): boolean {
  return !hasSupabaseEnv() || isDemoMode();
}

export async function getCategories(): Promise<Category[]> {
  if (useMock()) return mockCategories;

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    logger.error("getCategories failed", { err: String(err) });
    if (isDemoMode()) return mockCategories;
    return [];
  }
}

export async function getMangaList(options?: {
  categorySlug?: string;
  search?: string;
  limit?: number;
  /** Include unpublished (admin only — caller must enforce auth) */
  includeUnpublished?: boolean;
}): Promise<Manga[]> {
  if (useMock()) {
    let list = [...mockManga];
    if (options?.categorySlug) {
      const cat = mockCategories.find((c) => c.slug === options.categorySlug);
      list = list.filter((m) => m.category_id === cat?.id);
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description?.toLowerCase().includes(q)
      );
    }
    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (options?.limit) list = list.slice(0, options.limit);
    return list;
  }

  try {
    const supabase = await getSupabase();
    let query = supabase
      .from("manga")
      .select("*, category:categories(*)")
      .order("created_at", { ascending: false });

    if (!options?.includeUnpublished) {
      query = query.eq("is_published", true);
    }

    if (options?.categorySlug) {
      const { data: cat } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .maybeSingle();
      if (cat) query = query.eq("category_id", cat.id);
      else return [];
    }
    if (options?.search) {
      const safe = options.search.replace(/[%_,]/g, " ").slice(0, 100);
      query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
    }
    if (options?.limit) query = query.limit(options.limit);

    const { data, error } = await query;
    if (error) throw error;
    return (data as Manga[]) ?? [];
  } catch (err) {
    logger.error("getMangaList failed", { err: String(err) });
    if (isDemoMode()) return mockManga;
    return [];
  }
}

export async function getMangaById(
  id: string,
  opts?: { includeUnpublished?: boolean }
): Promise<Manga | null> {
  if (useMock()) {
    return mockManga.find((m) => m.id === id) ?? null;
  }

  try {
    const supabase = await getSupabase();
    let query = supabase
      .from("manga")
      .select("*, category:categories(*)")
      .eq("id", id);

    if (!opts?.includeUnpublished) {
      query = query.eq("is_published", true);
    }

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    return (data as Manga) ?? null;
  } catch (err) {
    logger.error("getMangaById failed", { err: String(err), id });
    if (isDemoMode()) return mockManga.find((m) => m.id === id) ?? null;
    return null;
  }
}

export async function getAdByZone(
  zone: PlacementZone
): Promise<AdBanner | null> {
  if (useMock()) {
    return (
      mockAds.find((a) => a.placement_zone === zone && a.is_active) ?? null
    );
  }

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("ad_banners")
      .select("*")
      .eq("placement_zone", zone)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data as AdBanner | null;
  } catch (err) {
    logger.error("getAdByZone failed", { err: String(err), zone });
    if (isDemoMode()) {
      return (
        mockAds.find((a) => a.placement_zone === zone && a.is_active) ?? null
      );
    }
    return null;
  }
}

export async function getAllAds(): Promise<AdBanner[]> {
  if (useMock()) return mockAds;

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from("ad_banners")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as AdBanner[]) ?? [];
  } catch (err) {
    logger.error("getAllAds failed", { err: String(err) });
    if (isDemoMode()) return mockAds;
    return [];
  }
}

/**
 * Increment view count for a manga. Returns the new total (or null on failure).
 * Prefers Postgres RPC `increment_manga_views`; falls back to read+update.
 */
export async function incrementMangaViews(id: string): Promise<number | null> {
  if (useMock()) {
    const m = mockManga.find((x) => x.id === id);
    if (!m) return null;
    m.views = (m.views ?? 0) + 1;
    return m.views;
  }

  try {
    const supabase = await getSupabase();

    // Atomic RPC (run supabase/add-views.sql first)
    const { data: rpcData, error: rpcError } = await supabase.rpc(
      "increment_manga_views",
      { manga_id: id }
    );

    if (!rpcError && typeof rpcData === "number") {
      return rpcData;
    }
    if (!rpcError && rpcData != null) {
      const n = Number(rpcData);
      if (!Number.isNaN(n)) return n;
    }

    // Fallback if RPC missing: non-atomic update
    const { data: row, error: readErr } = await supabase
      .from("manga")
      .select("views")
      .eq("id", id)
      .maybeSingle();
    if (readErr) throw readErr;
    if (!row) return null;

    const next = (Number(row.views) || 0) + 1;
    const { error: upErr } = await supabase
      .from("manga")
      .update({ views: next })
      .eq("id", id);
    if (upErr) throw upErr;
    return next;
  } catch (err) {
    logger.error("incrementMangaViews failed", { err: String(err), id });
    return null;
  }
}
