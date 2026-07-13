import type { Manga } from "@/lib/types";
import { MangaCard } from "./MangaCard";

interface MangaGridProps {
  manga: Manga[];
  emptyMessage?: string;
}

export function MangaGrid({
  manga,
  emptyMessage = "No manga found.",
}: MangaGridProps) {
  if (manga.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/10 bg-zinc-900/40 px-6 py-16 text-center">
        <p className="text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {manga.map((m) => (
        <MangaCard key={m.id} manga={m} />
      ))}
    </div>
  );
}
