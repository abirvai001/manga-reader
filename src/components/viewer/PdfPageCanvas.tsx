"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Page } from "react-pdf";
import { cn } from "@/lib/utils";

interface PdfPageCanvasProps {
  pageNumber: number;
  width?: number;
  scale?: number;
  className?: string;
  /** When true, only render once near viewport (lazy). */
  eager?: boolean;
}

/**
 * Renders a single PDF page as a clean canvas — no browser chrome,
 * toolbars, or download UI. Lazy-loads via IntersectionObserver.
 */
export function PdfPageCanvas({
  pageNumber,
  width,
  scale = 1,
  className,
  eager = false,
}: PdfPageCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(eager);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (eager || shouldRender) return;
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldRender(true);
          observer.disconnect();
        }
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eager, shouldRender]);

  const onRenderSuccess = useCallback(() => setLoaded(true), []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative mx-auto w-full max-w-full bg-zinc-900",
        className
      )}
      data-page={pageNumber}
    >
      {!loaded && (
        <div
          className="flex aspect-[3/4] w-full max-w-3xl mx-auto items-center justify-center bg-zinc-900"
          style={width ? { width, maxWidth: "100%" } : undefined}
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
        </div>
      )}
      {shouldRender && (
        <Page
          pageNumber={pageNumber}
          width={width}
          scale={scale}
          renderTextLayer={false}
          renderAnnotationLayer={false}
          loading={null}
          className={cn(
            "flex justify-center [&_canvas]:!h-auto [&_canvas]:max-w-full",
            !loaded && "absolute opacity-0"
          )}
          onRenderSuccess={onRenderSuccess}
        />
      )}
    </div>
  );
}
