import Image from "next/image";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { getMangaList } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { DeleteMangaButton } from "@/components/admin/DeleteMangaButton";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage Manga" };

export default async function AdminMangaPage() {
  const manga = await getMangaList({ includeUnpublished: true });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Manga library</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload PDFs and covers — readers see a native canvas viewer
          </p>
        </div>
        <Link
          href="/admin/manga/new"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Add manga
        </Link>
      </div>

      {manga.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center text-zinc-500">
          No manga yet.{" "}
          <Link href="/admin/manga/new" className="text-violet-400">
            Upload your first PDF
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {manga.map((m) => (
            <div
              key={m.id}
              className="flex gap-4 rounded-2xl border border-white/5 bg-zinc-900/50 p-4"
            >
              <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-zinc-800">
                {m.cover_image_url ? (
                  <Image
                    src={m.cover_image_url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-white">{m.title}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {m.category?.name ?? "Uncategorized"} ·{" "}
                  {formatDate(m.created_at)}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/manga/${m.id}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1 text-xs text-zinc-300 hover:bg-white/10"
                  >
                    <ExternalLink className="h-3 w-3" />
                    View
                  </Link>
                  <DeleteMangaButton id={m.id} title={m.title} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
