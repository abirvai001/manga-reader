"use client";

import type { PlacementZone } from "./types";

async function api<T>(
  url: string,
  init?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...init?.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function uploadFile(
  bucket: "pdfs" | "covers" | "ads",
  file: File
): Promise<string> {
  const kind = bucket === "pdfs" ? "pdf" : bucket === "covers" ? "cover" : "ad";
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  const data = await api<{ url: string }>("/api/admin/upload", {
    method: "POST",
    body: form,
  });
  return data.url;
}

export async function createManga(input: {
  title: string;
  description: string;
  category_id: string | null;
  cover_image_url: string | null;
  pdf_file_url: string;
}) {
  const data = await api<{ manga: { id: string } }>("/api/admin/manga", {
    method: "POST",
    body: JSON.stringify({
      ...input,
      is_published: true,
    }),
  });
  return data.manga;
}

export async function deleteManga(id: string) {
  await api(`/api/admin/manga?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function createCategory(name: string, slug: string) {
  const data = await api<{ category: { id: string; name: string; slug: string; created_at: string } }>(
    "/api/admin/categories",
    {
      method: "POST",
      body: JSON.stringify({ name, slug }),
    }
  );
  return data.category;
}

export async function deleteCategory(id: string) {
  await api(`/api/admin/categories?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export async function createAd(input: {
  banner_image_url: string;
  placement_zone: PlacementZone;
  target_url: string | null;
  is_active: boolean;
}) {
  const data = await api<{ ad: unknown }>("/api/admin/ads", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.ad;
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
  await api("/api/admin/ads", {
    method: "PATCH",
    body: JSON.stringify({ id, ...patch }),
  });
}

export async function deleteAd(id: string) {
  await api(`/api/admin/ads?id=${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
