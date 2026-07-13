"use client";

import { isSupabaseConfigured } from "./utils";
import type { PlacementZone } from "./types";

export async function uploadFile(
  bucket: "pdfs" | "covers" | "ads",
  file: File
): Promise<string> {
  if (!isSupabaseConfigured()) {
    // Demo: return object URL so UI can preview
    return URL.createObjectURL(file);
  }

  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const ext = file.name.split(".").pop() || "bin";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function createManga(input: {
  title: string;
  description: string;
  category_id: string | null;
  cover_image_url: string | null;
  pdf_file_url: string;
}) {
  if (!isSupabaseConfigured()) {
    return { id: `demo-${Date.now()}`, ...input, created_at: new Date().toISOString() };
  }

  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("manga")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteManga(id: string) {
  if (!isSupabaseConfigured()) return;
  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("manga").delete().eq("id", id);
  if (error) throw error;
}

export async function createCategory(name: string, slug: string) {
  if (!isSupabaseConfigured()) {
    return {
      id: `cat-demo-${Date.now()}`,
      name,
      slug,
      created_at: new Date().toISOString(),
    };
  }
  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .insert({ name, slug })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string) {
  if (!isSupabaseConfigured()) return;
  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function createAd(input: {
  banner_image_url: string;
  placement_zone: PlacementZone;
  target_url: string | null;
  is_active: boolean;
}) {
  if (!isSupabaseConfigured()) {
    return {
      id: `ad-demo-${Date.now()}`,
      ...input,
      created_at: new Date().toISOString(),
    };
  }
  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ad_banners")
    .insert(input)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAd(
  id: string,
  patch: Partial<{
    banner_image_url: string;
    placement_zone: PlacementZone;
    target_url: string | null;
    is_active: boolean;
  }>
) {
  if (!isSupabaseConfigured()) return;
  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("ad_banners").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteAd(id: string) {
  if (!isSupabaseConfigured()) return;
  const { createClient } = await import("./supabase/client");
  const supabase = createClient();
  const { error } = await supabase.from("ad_banners").delete().eq("id", id);
  if (error) throw error;
}
