"use client";

import { useEffect, useState } from "react";
import type { AdBanner as AdBannerType, PlacementZone } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AdBannerProps {
  zone: PlacementZone;
  /** Pre-fetched ad (server component). If omitted, fetches client-side via /api/ads. */
  ad?: AdBannerType | null;
  className?: string;
  /** Max height for the banner container */
  maxHeight?: number;
  variant?: "default" | "compact" | "sticky";
}

/**
 * Global reusable ad slot. Collapses to zero height when no active ad exists
 * for the given placement_zone — no blank space left behind.
 */
export function AdBanner({
  zone,
  ad: initialAd,
  className,
  maxHeight = 90,
  variant = "default",
}: AdBannerProps) {
  const [ad, setAd] = useState<AdBannerType | null | undefined>(initialAd);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (initialAd !== undefined) {
      setAd(initialAd);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/ads?zone=${zone}`);
        if (!res.ok) {
          if (!cancelled) setAd(null);
          return;
        }
        const data = await res.json();
        if (!cancelled) setAd(data.ad ?? null);
      } catch {
        if (!cancelled) setAd(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [zone, initialAd]);

  // Loading or missing → collapse cleanly
  if (ad === undefined || ad === null || failed) {
    return null;
  }

  const content = (
    <a
      href={ad.target_url || "#"}
      target={ad.target_url ? "_blank" : undefined}
      rel={ad.target_url ? "noopener noreferrer sponsored" : undefined}
      className={cn(
        "group relative block w-full overflow-hidden rounded-lg",
        "ring-1 ring-white/10 transition hover:ring-violet-500/40",
        className
      )}
      aria-label="Advertisement"
    >
      <span className="absolute left-2 top-1 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
        Ad
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.banner_image_url}
        alt="Advertisement"
        className={cn(
          "mx-auto w-full object-contain",
          variant === "compact" ? "max-h-16" : ""
        )}
        style={{ maxHeight: variant === "compact" ? 64 : maxHeight }}
        onError={() => setFailed(true)}
      />
    </a>
  );

  if (variant === "sticky") {
    return (
      <div className="w-full bg-zinc-950/95 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/80">
        <div className="mx-auto max-w-5xl px-2 py-1.5">{content}</div>
      </div>
    );
  }

  return content;
}

/** Server-friendly static ad (no client fetch). Still collapses when ad is null. */
export function AdBannerStatic({
  ad,
  className,
  maxHeight = 90,
}: {
  ad: AdBannerType | null;
  className?: string;
  maxHeight?: number;
}) {
  if (!ad) return null;

  return (
    <a
      href={ad.target_url || "#"}
      target={ad.target_url ? "_blank" : undefined}
      rel={ad.target_url ? "noopener noreferrer sponsored" : undefined}
      className={cn(
        "group relative block w-full overflow-hidden rounded-lg ring-1 ring-white/10",
        className
      )}
      aria-label="Advertisement"
    >
      <span className="absolute left-2 top-1 z-10 rounded bg-black/50 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-white/70">
        Ad
      </span>
      {/* Using img for GIF animation support */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={ad.banner_image_url}
        alt="Advertisement"
        className="mx-auto w-full object-contain"
        style={{ maxHeight }}
      />
    </a>
  );
}
