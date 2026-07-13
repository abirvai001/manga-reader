"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Document, pdfjs } from "react-pdf";
import type { AdBanner as AdBannerType, ReadingMode } from "@/lib/types";
import { AdBanner } from "@/components/ads/AdBanner";
import { PdfPageCanvas } from "./PdfPageCanvas";
import { ViewerControls } from "./ViewerControls";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Self-hosted worker (public/pdf.worker.min.mjs) — no third-party CDN in production
pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

/** Insert an inline ad after every N pages in vertical mode */
const INLINE_AD_EVERY_N_PAGES = 5;

interface MangaViewerProps {
  title: string;
  pdfUrl: string;
  topAd?: AdBannerType | null;
  bottomAd?: AdBannerType | null;
  inlineAd?: AdBannerType | null;
}

export function MangaViewer({
  title,
  pdfUrl,
  topAd = null,
  bottomAd = null,
  inlineAd = null,
}: MangaViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [mode, setMode] = useState<ReadingMode>("vertical");
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [containerWidth, setContainerWidth] = useState(800);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const shellRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Measure container for responsive page width
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setContainerWidth(Math.min(w - 32, 960));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Auto-hide controls on idle
  const bumpControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2800);
  }, []);

  useEffect(() => {
    bumpControls();
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [bumpControls]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        setPage((p) => Math.min(p + (mode === "double" ? 2 : 1), numPages));
      } else if (e.key === "ArrowLeft") {
        setPage((p) => Math.max(p - (mode === "double" ? 2 : 1), 1));
      } else if (e.key === "Escape" && document.fullscreenElement) {
        document.exitFullscreen();
      }
      bumpControls();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, numPages, bumpControls]);

  const pageWidth = useMemo(() => {
    const base =
      mode === "double" ? Math.floor(containerWidth / 2) - 8 : containerWidth;
    return Math.max(280, Math.floor(base * zoom));
  }, [containerWidth, mode, zoom]);

  const onDocumentLoad = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setLoading(false);
      setError(null);
    },
    []
  );

  const toggleFullscreen = useCallback(async () => {
    const el = shellRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        setFullscreen(true);
      } else {
        await document.exitFullscreen();
        setFullscreen(false);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  // Vertical stream: pages + inline ads every N pages
  const verticalItems = useMemo(() => {
    const items: (
      | { type: "page"; pageNumber: number }
      | { type: "ad"; key: string }
    )[] = [];
    for (let i = 1; i <= numPages; i++) {
      items.push({ type: "page", pageNumber: i });
      if (
        inlineAd &&
        i % INLINE_AD_EVERY_N_PAGES === 0 &&
        i < numPages
      ) {
        items.push({ type: "ad", key: `ad-after-${i}` });
      }
    }
    return items;
  }, [numPages, inlineAd]);

  return (
    <div
      ref={shellRef}
      className="relative flex min-h-screen flex-col bg-black select-none"
      onMouseMove={bumpControls}
      onClick={bumpControls}
      onTouchStart={bumpControls}
    >
      {/* Sticky top ad */}
      {topAd && (
        <div className="sticky top-0 z-30">
          <AdBanner zone="viewer_top" ad={topAd} variant="sticky" maxHeight={70} />
        </div>
      )}

      <ViewerControls
        title={title}
        mode={mode}
        onModeChange={(m) => {
          setMode(m);
          bumpControls();
        }}
        page={page}
        numPages={numPages}
        onPrev={() => setPage((p) => Math.max(p - (mode === "double" ? 2 : 1), 1))}
        onNext={() =>
          setPage((p) => Math.min(p + (mode === "double" ? 2 : 1), numPages))
        }
        onPageJump={(p) => setPage(Math.min(Math.max(1, p), numPages || 1))}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(z + 0.15, 2.5))}
        onZoomOut={() => setZoom((z) => Math.max(z - 0.15, 0.5))}
        fullscreen={fullscreen}
        onToggleFullscreen={toggleFullscreen}
        visible={controlsVisible}
      />

      {/* Reader body — no iframe, pure canvas pages */}
      <div
        className="relative flex-1 overflow-y-auto overflow-x-hidden"
        style={{
          paddingTop: controlsVisible ? (mode !== "vertical" ? 96 : 72) : 12,
          paddingBottom: bottomAd ? 100 : 24,
        }}
      >
        {error && (
          <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-red-950/40 p-6 text-center text-red-200">
            <p className="font-medium">Failed to load manga PDF</p>
            <p className="mt-2 text-sm text-red-300/80">{error}</p>
          </div>
        )}

        <Document
          file={pdfUrl}
          onLoadSuccess={onDocumentLoad}
          onLoadError={(err) => {
            setError(err.message || "Could not open PDF");
            setLoading(false);
          }}
          loading={
            <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
              <p className="text-sm text-zinc-500">Loading manga…</p>
            </div>
          }
          className="mx-auto w-full max-w-6xl px-2"
        >
          {loading ? null : mode === "vertical" ? (
            <div className="flex flex-col items-center gap-1 pb-8">
              {verticalItems.map((item) =>
                item.type === "page" ? (
                  <PdfPageCanvas
                    key={`p-${item.pageNumber}`}
                    pageNumber={item.pageNumber}
                    width={pageWidth}
                    className="shadow-2xl shadow-black/50"
                  />
                ) : (
                  <div
                    key={item.key}
                    className="my-4 w-full max-w-3xl px-2"
                  >
                    <AdBanner
                      zone="viewer_inline"
                      ad={inlineAd}
                      maxHeight={100}
                      className="rounded-xl"
                    />
                  </div>
                )
              )}
            </div>
          ) : mode === "single" ? (
            <div className="flex min-h-[60vh] items-center justify-center py-4">
              <PdfPageCanvas
                key={`single-${page}`}
                pageNumber={page}
                width={pageWidth}
                eager
                className="shadow-2xl shadow-black/60"
              />
            </div>
          ) : (
            <div className="flex min-h-[60vh] flex-wrap items-center justify-center gap-2 py-4">
              <PdfPageCanvas
                key={`d-l-${page}`}
                pageNumber={page}
                width={pageWidth}
                eager
                className="shadow-2xl shadow-black/60"
              />
              {page + 1 <= numPages && (
                <PdfPageCanvas
                  key={`d-r-${page + 1}`}
                  pageNumber={page + 1}
                  width={pageWidth}
                  eager
                  className="shadow-2xl shadow-black/60"
                />
              )}
            </div>
          )}
        </Document>

        {/* Tap zones for page turn (paged modes) */}
        {mode !== "vertical" && !loading && (
          <>
            <button
              type="button"
              aria-label="Previous page"
              className="fixed bottom-24 left-0 top-20 z-20 w-[18%] cursor-w-resize bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setPage((p) => Math.max(p - (mode === "double" ? 2 : 1), 1));
              }}
            />
            <button
              type="button"
              aria-label="Next page"
              className="fixed bottom-24 right-0 top-20 z-20 w-[18%] cursor-e-resize bg-transparent"
              onClick={(e) => {
                e.stopPropagation();
                setPage((p) =>
                  Math.min(p + (mode === "double" ? 2 : 1), numPages)
                );
              }}
            />
          </>
        )}
      </div>

      {/* Sticky bottom ad */}
      {bottomAd && (
        <div className="fixed inset-x-0 bottom-0 z-30">
          <AdBanner
            zone="viewer_bottom"
            ad={bottomAd}
            variant="sticky"
            maxHeight={70}
          />
        </div>
      )}
    </div>
  );
}
