"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { formatViews } from "@/lib/utils";

interface ViewTrackerProps {
  mangaId: string;
  /** Initial views from the server */
  initialViews?: number;
  /** Count this visit (default true). Set false on admin pages. */
  track?: boolean;
  className?: string;
  showIcon?: boolean;
}

/**
 * Displays view count and registers +1 once per browser session per manga.
 */
export function ViewTracker({
  mangaId,
  initialViews = 0,
  track = true,
  className = "",
  showIcon = true,
}: ViewTrackerProps) {
  const [views, setViews] = useState(initialViews);

  useEffect(() => {
    setViews(initialViews);
  }, [initialViews, mangaId]);

  useEffect(() => {
    if (!track || !mangaId) return;

    const key = `ym_viewed_${mangaId}`;
    try {
      if (sessionStorage.getItem(key) === "1") return;
    } catch {
      /* private mode — still try to count */
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/manga/${mangaId}/view`, {
          method: "POST",
        });
        const data = await res.json().catch(() => ({}));
        if (!cancelled && typeof data.views === "number" && data.ok) {
          setViews(data.views);
          try {
            sessionStorage.setItem(key, "1");
          } catch {
            /* ignore */
          }
        }
      } catch {
        /* ignore network errors */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mangaId, track]);

  return (
    <span
      className={`inline-flex items-center gap-1 tabular-nums ${className}`}
      title={`${views.toLocaleString()} views`}
    >
      {showIcon && <Eye className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />}
      <span>{formatViews(views)} views</span>
    </span>
  );
}
