import { NextResponse } from "next/server";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  hasSupabaseEnv,
  isDemoMode,
} from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  const configured = hasSupabaseEnv();
  let dbOk: boolean | null = null;
  let dbError: string | null = null;

  if (configured) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { error } = await supabase.from("categories").select("id").limit(1);
      if (error) {
        dbOk = false;
        dbError = error.message;
      } else {
        dbOk = true;
      }
    } catch (e) {
      dbOk = false;
      dbError = e instanceof Error ? e.message : String(e);
    }
  } else {
    dbError = !url
      ? "Missing NEXT_PUBLIC_SUPABASE_URL"
      : !key
        ? "Missing NEXT_PUBLIC_SUPABASE_ANON_KEY"
        : "Invalid Supabase configuration";
  }

  const healthy = configured ? dbOk === true : isDemoMode();
  const status = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      brand: "YourManga.EN",
      supabase: configured,
      demoMode: isDemoMode(),
      database: dbOk,
      // Safe diagnostics (no secrets)
      projectHost: url ? new URL(url).host : null,
      hasAnonKey: key.length > 0,
      dbError,
    },
    { status }
  );
}
