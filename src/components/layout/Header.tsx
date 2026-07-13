"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Menu, Search, Shield, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/", label: "Home" },
  { href: "/browse", label: "Browse" },
  { href: "/admin", label: "Admin" },
];

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  // Hide site chrome on immersive reader
  if (pathname?.startsWith("/manga/") && !pathname.includes("/edit")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold tracking-tight text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow-lg shadow-violet-500/25">
            <BookOpen className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">
            Manga<span className="text-violet-400">Flow</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href))
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              {item.label === "Admin" ? (
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5" />
                  Admin
                </span>
              ) : (
                item.label
              )}
            </Link>
          ))}
        </nav>

        <form
          action="/browse"
          className="ml-auto flex max-w-xs flex-1 items-center"
        >
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              name="q"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search manga..."
              className="w-full rounded-full border border-white/10 bg-zinc-900/80 py-2 pl-9 pr-3 text-sm text-white placeholder:text-zinc-500 outline-none ring-violet-500/0 transition focus:border-violet-500/50 focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </form>

        <button
          type="button"
          className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-white md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <nav className="border-t border-white/5 px-4 py-3 md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
