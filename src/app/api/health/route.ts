import { NextResponse } from "next/server";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const configured = hasSupabaseEnv();
  let dbOk: boolean | null = null;

  if (configured) {
    try {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { error } = await supabase.from("categories").select("id").limit(1);
      dbOk = !error;
    } catch {
      dbOk = false;
    }
  }

  const healthy = !configured ? isDemoMode() : dbOk === true;
  const status = healthy ? 200 : 503;

  return NextResponse.json(
    {
      status: healthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version ?? "0.1.0",
      supabase: configured,
      demoMode: isDemoMode(),
      database: dbOk,
    },
    { status }
  );
}
