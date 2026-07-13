"use client";

import dynamic from "next/dynamic";
import type { AdBanner } from "@/lib/types";

const MangaViewer = dynamic(
  () => import("./MangaViewer").then((m) => m.MangaViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          <p className="text-sm text-zinc-500">Preparing reader…</p>
        </div>
      </div>
    ),
  }
);

interface Props {
  title: string;
  pdfUrl: string;
  topAd?: AdBanner | null;
  bottomAd?: AdBanner | null;
  inlineAd?: AdBanner | null;
}

export function MangaViewerLoader(props: Props) {
  return <MangaViewer {...props} />;
}
