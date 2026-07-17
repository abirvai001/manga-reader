"use client";

import { createClient } from "@/lib/supabase/client";
import { validateUploadFile, sanitizeFilename } from "@/lib/validation";

export type UploadKind = "pdf" | "cover" | "ad";

const BUCKETS: Record<UploadKind, string> = {
  pdf: "pdfs",
  cover: "covers",
  ad: "ads",
};

/**
 * Upload directly from the browser to Supabase Storage.
 * Avoids Vercel serverless body size limits (~4.5MB) that break large PDFs.
 */
export async function uploadToSupabaseStorage(
  kind: UploadKind,
  file: File,
  onProgress?: (pct: number) => void
): Promise<string> {
  const validation = validateUploadFile(file, kind);
  if (!validation.ok) {
    throw new Error(validation.error);
  }

  let supabase;
  try {
    supabase = createClient();
  } catch {
    throw new Error(
      "Supabase is not configured in this browser build. Redeploy the site with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const {
    data: { session },
    error: sessionErr,
  } = await supabase.auth.getSession();
  if (sessionErr) {
    throw new Error(`Auth error: ${sessionErr.message}`);
  }
  if (!session?.user) {
    throw new Error(
      "You are not logged in. Open /admin/login, sign in, then try upload again."
    );
  }

  // Refresh session so the storage JWT is valid
  await supabase.auth.getUser();

  const bucket = BUCKETS[kind];
  const safe = sanitizeFilename(file.name || `${kind}.bin`);
  const path = `${kind}/${Date.now()}-${crypto.randomUUID()}-${safe}`;

  onProgress?.(10);

  const contentType =
    file.type ||
    (kind === "pdf"
      ? "application/pdf"
      : kind === "cover" || kind === "ad"
        ? "image/jpeg"
        : "application/octet-stream");

  // Prefer signed upload URL (more reliable with RLS)
  const signed = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (!signed.error && signed.data?.token) {
    onProgress?.(30);
    const { error: upErr } = await supabase.storage
      .from(bucket)
      .uploadToSignedUrl(path, signed.data.token, file, {
        contentType,
        upsert: false,
      });
    if (upErr) {
      throw mapStorageError(upErr.message, bucket);
    }
  } else {
    // Fallback: direct upload with auth header from session
    onProgress?.(30);
    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "31536000",
      upsert: false,
      contentType,
    });
    if (error) {
      // If signed failed due to missing bucket, surface that first
      if (signed.error) {
        throw mapStorageError(
          `${error.message} (signed: ${signed.error.message})`,
          bucket
        );
      }
      throw mapStorageError(error.message, bucket);
    }
  }

  onProgress?.(90);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Upload succeeded but public URL could not be generated.");
  }

  onProgress?.(100);
  return data.publicUrl;
}

function mapStorageError(msg: string, bucket: string): Error {
  const m = msg || "Unknown storage error";
  if (/bucket not found|No such bucket|not found/i.test(m)) {
    return new Error(
      `Storage bucket "${bucket}" does not exist yet.\n\nFix: Supabase → SQL Editor → run the SQL shown on this page (creates pdfs, covers, ads buckets + policies).`
    );
  }
  if (/row-level security|violates|policy|permission|not authorized|403|JWT/i.test(m)) {
    return new Error(
      `Upload blocked by storage security policy.\n\nFix: Run storage-buckets.sql in Supabase SQL Editor (must include INSERT policies for role authenticated).`
    );
  }
  if (/payload|too large|entity too large|maximum/i.test(m)) {
    return new Error(`File too large. PDF max 100MB. (${m})`);
  }
  if (/Failed to fetch|NetworkError|network/i.test(m)) {
    return new Error(
      `Network error talking to Supabase Storage. Check your connection / CORS. (${m})`
    );
  }
  return new Error(m);
}

/** Quick preflight: can we see the pdfs bucket? */
export async function checkStorageReady(): Promise<{
  ok: boolean;
  detail: string;
  loggedIn: boolean;
}> {
  try {
    const supabase = createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return {
        ok: false,
        loggedIn: false,
        detail: "Not logged in — go to /admin/login first.",
      };
    }

    // Try a tiny probe upload path list
    const { data, error } = await supabase.storage.from("pdfs").list("", {
      limit: 1,
    });
    if (error) {
      return {
        ok: false,
        loggedIn: true,
        detail: mapStorageError(error.message, "pdfs").message,
      };
    }
    return {
      ok: true,
      loggedIn: true,
      detail: `Storage OK (pdfs bucket reachable, ${data?.length ?? 0} root items).`,
    };
  } catch (e) {
    return {
      ok: false,
      loggedIn: false,
      detail: e instanceof Error ? e.message : String(e),
    };
  }
}
