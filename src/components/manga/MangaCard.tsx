import Image from "next/image";
import Link from "next/link";
import type { Manga } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface MangaCardProps {
  manga: Manga;
}

export function MangaCard({ manga }: MangaCardProps) {
  return (
    <Link
      href={`/manga/${manga.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/60 shadow-xl shadow-black/20 transition duration-300 hover:-translate-y-1 hover:border-violet-500/30 hover:shadow-violet-500/10"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-zinc-800">
        {manga.cover_image_url ? (
          <Image
            src={manga.cover_image_url}
            alt={manga.title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-violet-900/40 to-zinc-900 text-zinc-500">
            No Cover
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
        {manga.category && (
          <span className="absolute left-3 top-3 rounded-full bg-violet-600/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur">
            {manga.category.name}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="line-clamp-2 text-base font-semibold leading-snug text-white group-hover:text-violet-300">
          {manga.title}
        </h3>
        {manga.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-zinc-500">
            {manga.description}
          </p>
        )}
        <p className="mt-auto pt-2 text-[11px] text-zinc-600">
          {formatDate(manga.created_at)}
        </p>
      </div>
    </Link>
  );
}
