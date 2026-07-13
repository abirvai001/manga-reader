import Link from "next/link";

export default function MangaNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-bold text-white">Manga not found</h1>
      <p className="text-zinc-500">
        This title may have been removed or the link is incorrect.
      </p>
      <Link
        href="/browse"
        className="rounded-full bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
      >
        Back to library
      </Link>
    </div>
  );
}
