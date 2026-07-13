"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!isSupabaseConfigured()) {
        // Demo mode: accept any credentials
        sessionStorage.setItem("mangaflow_demo_admin", "1");
        router.push("/admin");
        router.refresh();
        return;
      }

      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw authError;
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/80 p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/20 text-violet-400">
            <Shield className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-white">Admin login</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Manage manga library and ad placements
          </p>
        </div>

        {!isSupabaseConfigured() && (
          <p className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
            Demo mode: any email/password works. Configure Supabase for real
            auth.
          </p>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-zinc-400">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-zinc-950 px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
