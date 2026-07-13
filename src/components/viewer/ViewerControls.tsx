"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Maximize2,
  Minimize2,
  Rows3,
  Square,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import type { ReadingMode } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ViewerControlsProps {
  title: string;
  mode: ReadingMode;
  onModeChange: (mode: ReadingMode) => void;
  page: number;
  numPages: number;
  onPrev: () => void;
  onNext: () => void;
  onPageJump: (page: number) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  visible: boolean;
}

export function ViewerControls({
  title,
  mode,
  onModeChange,
  page,
  numPages,
  onPrev,
  onNext,
  onPageJump,
  zoom,
  onZoomIn,
  onZoomOut,
  fullscreen,
  onToggleFullscreen,
  visible,
}: ViewerControlsProps) {
  const modes: { id: ReadingMode; icon: typeof Rows3; label: string }[] = [
    { id: "vertical", icon: Rows3, label: "Webtoon" },
    { id: "single", icon: Square, label: "Single" },
    { id: "double", icon: Columns2, label: "Double" },
  ];

  return (
    <div
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-transform duration-300",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-4">
          <Link
            href="/"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-white/10 hover:text-white"
            title="Close reader"
          >
            <X className="h-5 w-5" />
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-violet-400">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              <p className="truncate text-sm font-medium text-white">{title}</p>
            </div>
          </div>

          {/* Mode switcher */}
          <div className="hidden items-center rounded-lg bg-zinc-900 p-0.5 sm:flex">
            {modes.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => onModeChange(id)}
                title={label}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition",
                  mode === id
                    ? "bg-violet-600 text-white shadow"
                    : "text-zinc-400 hover:text-white"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Page nav (paged modes) */}
          {mode !== "vertical" && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onPrev}
                disabled={page <= 1}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-1 text-xs text-zinc-400">
                <input
                  type="number"
                  min={1}
                  max={numPages || 1}
                  value={page}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isNaN(n)) onPageJump(n);
                  }}
                  className="w-12 rounded border border-white/10 bg-zinc-900 px-1 py-1 text-center text-white outline-none focus:border-violet-500"
                />
                <span>/ {numPages || "—"}</span>
              </div>
              <button
                type="button"
                onClick={onNext}
                disabled={page >= numPages}
                className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {mode === "vertical" && numPages > 0 && (
            <span className="hidden text-xs text-zinc-500 sm:inline">
              {numPages} pages
            </span>
          )}

          <div className="flex items-center gap-0.5">
            <button
              type="button"
              onClick={onZoomOut}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-xs text-zinc-500">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={onZoomIn}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-white/10 hover:text-white"
              title="Fullscreen"
            >
              {fullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile mode switcher */}
        <div className="flex gap-1 border-t border-white/5 px-3 py-1.5 sm:hidden">
          {modes.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => onModeChange(id)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1 rounded-md py-1.5 text-xs font-medium",
                mode === id
                  ? "bg-violet-600 text-white"
                  : "bg-zinc-900 text-zinc-400"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
