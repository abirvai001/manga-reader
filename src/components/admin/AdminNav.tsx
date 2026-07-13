"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Image as ImageIcon,
  LayoutDashboard,
  BookOpen,
  FolderOpen,
  LogOut,
  Megaphone,
} from "lucide-react";
import { cn, isSupabaseConfigured } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/manga", label: "Manga", icon: BookOpen },
  { href: "/admin/categories", label: "Categories", icon: FolderOpen },
  { href: "/admin/ads", label: "Ad Banners", icon: Megaphone },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    if (isSupabaseConfigured()) {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        await supabase.auth.signOut();
      } catch {
        /* demo mode */
      }
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-full shrink-0 border-b border-white/5 bg-zinc-900/50 lg:w-56 lg:border-b-0 lg:border-r">
      <div className="sticky top-16 p-4">
        <div className="mb-4 flex items-center gap-2 px-2">
          <ImageIcon className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Control panel
          </span>
        </div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {links.map(({ href, label, icon: Icon, exact }) => {
            const active = exact
              ? pathname === href
              : pathname === href || pathname?.startsWith(href + "/");
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <button
          type="button"
          onClick={signOut}
          className="mt-4 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:bg-white/5 hover:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
