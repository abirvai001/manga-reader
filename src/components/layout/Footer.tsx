"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Mail } from "lucide-react";

export function Footer() {
  const pathname = usePathname();

  if (pathname?.startsWith("/manga/") && !pathname.includes("/edit")) {
    return null;
  }

  return (
    <footer className="mt-auto border-t border-white/5 bg-zinc-950">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-4 py-10 sm:px-6">
        <div className="flex w-full flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <BookOpen className="h-4 w-4 text-violet-400" />
            <span>
              © {new Date().getFullYear()} YourManga.EN — PDF manga, native
              feel.
            </span>
          </div>
          <div className="flex gap-6 text-sm text-zinc-500">
            <Link href="/browse" className="hover:text-zinc-300">
              Browse
            </Link>
            <Link href="/admin" className="hover:text-zinc-300">
              Admin
            </Link>
          </div>
        </div>

        <div className="w-full border-t border-white/5 pt-6 text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-600">
            Sponsorship &amp; advertising
          </p>
          <a
            href="mailto:abirodroid.admob@gmail.com"
            className="mt-2 inline-flex items-center gap-2 text-sm text-violet-400 transition hover:text-violet-300"
          >
            <Mail className="h-4 w-4" />
            abirodroid.admob@gmail.com
          </a>
        </div>
      </div>
    </footer>
  );
}
