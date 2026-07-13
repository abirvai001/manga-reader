"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import type { AdBanner, PlacementZone } from "@/lib/types";
import { PLACEMENT_ZONES } from "@/lib/types";
import {
  createAd,
  deleteAd,
  updateAd,
  uploadFile,
} from "@/lib/admin-actions";
import { isSupabaseConfigured } from "@/lib/utils";

export default function AdminAdsPage() {
  const [ads, setAds] = useState<AdBanner[]>([]);
  const [zone, setZone] = useState<PlacementZone>("homepage_top");
  const [targetUrl, setTargetUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/ads/all");
    const data = await res.json();
    setAds(data.ads ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setMessage("Choose a banner image (PNG, JPG, or GIF).");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const url = await uploadFile("ads", file);
      const row = await createAd({
        banner_image_url: url,
        placement_zone: zone,
        target_url: targetUrl || null,
        is_active: true,
      });
      if (!isSupabaseConfigured()) {
        setAds((prev) => [row as AdBanner, ...prev]);
        setMessage(
          "Demo mode: banner added for this session. Connect Supabase to persist."
        );
      } else {
        await load();
        setMessage("Ad banner created.");
      }
      setFile(null);
      setTargetUrl("");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  async function toggleActive(ad: AdBanner) {
    try {
      await updateAd(ad.id, { is_active: !ad.is_active });
      setAds((prev) =>
        prev.map((a) =>
          a.id === ad.id ? { ...a, is_active: !a.is_active } : a
        )
      );
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Update failed");
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this ad banner?")) return;
    try {
      await deleteAd(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Ad banners</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Sitewide placement zones — empty zones collapse (no blank space)
      </p>

      <form
        onSubmit={onCreate}
        className="mt-6 space-y-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-5"
      >
        <h2 className="text-sm font-semibold text-white">Upload new banner</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Placement zone
            </label>
            <select
              value={zone}
              onChange={(e) => setZone(e.target.value as PlacementZone)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            >
              {PLACEMENT_ZONES.map((z) => (
                <option key={z.value} value={z.value}>
                  {z.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Target URL
            </label>
            <input
              type="url"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              placeholder="https://…"
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
            />
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-zinc-400">
            Banner image (PNG, JPG, GIF)
          </label>
          <input
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="w-full text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-violet-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {loading ? "Uploading…" : "Add banner"}
        </button>
        {message && <p className="text-sm text-zinc-400">{message}</p>}
      </form>

      <div className="mt-8 space-y-4">
        {ads.map((ad) => (
          <div
            key={ad.id}
            className="overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 px-4 py-2.5">
              <div>
                <span className="text-sm font-medium text-white">
                  {PLACEMENT_ZONES.find((z) => z.value === ad.placement_zone)
                    ?.label ?? ad.placement_zone}
                </span>
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                    ad.is_active
                      ? "bg-emerald-500/15 text-emerald-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {ad.is_active ? "Active" : "Off"}
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => toggleActive(ad)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white"
                  title="Toggle active"
                >
                  {ad.is_active ? (
                    <ToggleRight className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-5 w-5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(ad.id)}
                  className="rounded-lg p-2 text-zinc-400 hover:bg-red-500/10 hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="bg-zinc-950/50 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.banner_image_url}
                alt=""
                className="mx-auto max-h-24 object-contain"
              />
              {ad.target_url && (
                <p className="mt-2 truncate text-center text-xs text-zinc-600">
                  → {ad.target_url}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
