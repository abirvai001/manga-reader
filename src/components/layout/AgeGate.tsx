"use client";

import { useEffect, useState } from "react";
import { ShieldAlert } from "lucide-react";

const STORAGE_KEY = "yourmanga_age_verified_18";

/**
 * Full-screen 18+ consent gate.
 * Yes → enter site (remembered in localStorage)
 * No  → leave the site
 */
export function AgeGate({ children }: { children: React.ReactNode }) {
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const ok = localStorage.getItem(STORAGE_KEY) === "1";
      setAllowed(ok);
    } catch {
      setAllowed(false);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* private mode — still allow this session */
    }
    setAllowed(true);
  }

  function decline() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    // Prefer going back; if no history, leave the web
    if (typeof window !== "undefined") {
      if (window.history.length > 1) {
        window.history.back();
        // Fallback if back doesn't leave this origin
        window.setTimeout(() => {
          window.location.replace("https://www.google.com/");
        }, 400);
      } else {
        window.location.replace("https://www.google.com/");
      }
    }
  }

  // Avoid flash: show nothing until we know consent state
  if (allowed === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 px-4">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-violet-950/40 via-zinc-950 to-zinc-950"
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="age-gate-title"
          className="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/95 p-8 shadow-2xl shadow-black/50 backdrop-blur"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
            <ShieldAlert className="h-7 w-7" aria-hidden />
          </div>

          <h1
            id="age-gate-title"
            className="mt-5 text-center text-2xl font-bold tracking-tight text-white"
          >
            18+ only
          </h1>
          <p className="mt-3 text-center text-sm leading-relaxed text-zinc-400">
            YourManga.EN contains adult content, including mature and explicit
            manga. You must be at least{" "}
            <strong className="text-zinc-200">18 years old</strong> (or the age
            of majority where you live) to enter.
          </p>
          <p className="mt-3 text-center text-xs text-zinc-500">
            By choosing <span className="text-zinc-400">I am 18+</span>, you
            confirm you are of legal age and want to view adult material.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={accept}
              className="flex-1 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500"
            >
              I am 18+ — Enter
            </button>
            <button
              type="button"
              onClick={decline}
              className="flex-1 rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white"
            >
              Under 18 — Leave
            </button>
          </div>

          <p className="mt-6 text-center text-[11px] text-zinc-600">
            YourManga.EN · Adult content warning
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
