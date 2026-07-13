import Link from "next/link";
import { BookOpen, FolderOpen, Megaphone, Plus } from "lucide-react";
import { getAllAds, getCategories, getMangaList } from "@/lib/data";
import { isSupabaseConfigured } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const [manga, categories, ads] = await Promise.all([
    getMangaList(),
    getCategories(),
    getAllAds(),
  ]);

  const stats = [
    {
      label: "Manga titles",
      value: manga.length,
      href: "/admin/manga",
      icon: BookOpen,
      color: "from-violet-600 to-purple-600",
    },
    {
      label: "Categories",
      value: categories.length,
      href: "/admin/categories",
      icon: FolderOpen,
      color: "from-blue-600 to-cyan-600",
    },
    {
      label: "Ad banners",
      value: ads.length,
      href: "/admin/ads",
      icon: Megaphone,
      color: "from-fuchsia-600 to-pink-600",
    },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Content &amp; monetization control center
          </p>
        </div>
        <Link
          href="/admin/manga/new"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Upload manga
        </Link>
      </div>

      {!isSupabaseConfigured() && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          <strong>Demo mode.</strong> Stats reflect mock data. Connect Supabase
          (see README) to persist uploads, storage buckets, and real auth.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, href, icon: Icon, color }) => (
          <Link
            key={label}
            href={href}
            className="group rounded-2xl border border-white/5 bg-zinc-900/60 p-5 transition hover:border-violet-500/30"
          >
            <div
              className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-3xl font-bold text-white">{value}</p>
            <p className="mt-1 text-sm text-zinc-500 group-hover:text-zinc-400">
              {label}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Recent manga</h2>
        <div className="overflow-hidden rounded-2xl border border-white/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-900/80 text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">
                  Category
                </th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {manga.slice(0, 8).map((m) => (
                <tr key={m.id} className="bg-zinc-950/40 hover:bg-zinc-900/40">
                  <td className="px-4 py-3 font-medium text-white">
                    {m.title}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-500 sm:table-cell">
                    {m.category?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/manga/${m.id}`}
                      className="text-violet-400 hover:text-violet-300"
                    >
                      Open reader
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
