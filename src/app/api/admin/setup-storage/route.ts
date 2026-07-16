import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { getSupabaseUrl, hasSupabaseEnv } from "@/lib/env";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

const BUCKETS = [
  {
    id: "pdfs",
    name: "pdfs",
    public: true,
    fileSizeLimit: 104857600,
    allowedMimeTypes: ["application/pdf"],
  },
  {
    id: "covers",
    name: "covers",
    public: true,
    fileSizeLimit: 5242880,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  },
  {
    id: "ads",
    name: "ads",
    public: true,
    fileSizeLimit: 3145728,
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ],
  },
] as const;

/**
 * Creates public storage buckets using the service role key (server-only).
 * Set SUPABASE_SERVICE_ROLE_KEY on Vercel for one-click setup.
 */
export async function POST() {
  try {
    await requireAdmin();

    if (!hasSupabaseEnv()) {
      return jsonError("Supabase is not configured", 503);
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    if (!serviceKey) {
      return jsonError(
        "Missing SUPABASE_SERVICE_ROLE_KEY. Add it in Vercel env (Dashboard → Settings → API → service_role), or run supabase/storage-buckets.sql in the SQL Editor.",
        400,
        {
          sqlHint:
            "Supabase → SQL Editor → paste supabase/storage-buckets.sql → Run",
          bucketsNeeded: BUCKETS.map((b) => b.id),
        }
      );
    }

    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(getSupabaseUrl(), serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existing, error: listErr } = await admin.storage.listBuckets();
    if (listErr) {
      logger.error("listBuckets failed", { error: listErr.message });
      return jsonError(listErr.message, 400);
    }

    const names = new Set((existing || []).map((b) => b.name));
    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];

    for (const b of BUCKETS) {
      if (names.has(b.name)) {
        skipped.push(b.name);
        continue;
      }
      const { error } = await admin.storage.createBucket(b.id, {
        public: b.public,
        fileSizeLimit: b.fileSizeLimit,
        allowedMimeTypes: [...b.allowedMimeTypes],
      });
      if (error) {
        errors.push(`${b.name}: ${error.message}`);
      } else {
        created.push(b.name);
      }
    }

    // Apply storage policies via SQL if possible (rpc may not exist)
    // Policies are best applied via storage-buckets.sql

    return jsonOk({
      ok: errors.length === 0,
      created,
      skipped,
      errors,
      message:
        errors.length === 0
          ? "Storage buckets ready. You can upload PDFs now."
          : "Some buckets failed. See errors; you may need to run SQL policies.",
    });
  } catch (err) {
    return handleApiError(err, "POST /api/admin/setup-storage");
  }
}

export async function GET() {
  try {
    await requireAdmin();
    if (!hasSupabaseEnv()) {
      return jsonOk({ configured: false, buckets: [] });
    }

    // List with user client (may return empty for non-service)
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data, error } = await supabase.storage.listBuckets();
    return jsonOk({
      configured: true,
      buckets: (data || []).map((b) => b.name),
      error: error?.message ?? null,
      hasServiceRole: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    });
  } catch (err) {
    return handleApiError(err, "GET /api/admin/setup-storage");
  }
}
