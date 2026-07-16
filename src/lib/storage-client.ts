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

  const supabase = createClient();
  const {
    data: { user },
    error: userErr,
  } = await supabase.auth.getUser();
  if (userErr || !user) {
    throw new Error("Please log in again before uploading.");
  }

  const bucket = BUCKETS[kind];
  const safe = sanitizeFilename(file.name || `${kind}.bin`);
  const path = `${kind}/${Date.now()}-${crypto.randomUUID()}-${safe}`;

  onProgress?.(5);

  // Ensure content-type for PDFs (some browsers send empty type)
  const contentType =
    file.type ||
    (kind === "pdf"
      ? "application/pdf"
      : kind === "cover" || kind === "ad"
        ? "image/jpeg"
        : "application/octet-stream");

  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType,
  });

  if (error) {
    const msg = error.message || String(error);
    if (/bucket not found|not found/i.test(msg)) {
      throw new Error(
        `Storage bucket "${bucket}" is missing. Open Admin → click “Fix storage buckets”, or run supabase/storage-buckets.sql in Supabase SQL Editor.`
      );
    }
    if (/row-level security|policy|permission|not authorized|403/i.test(msg)) {
      throw new Error(
        `Upload blocked by storage permissions. Run supabase/storage-buckets.sql in the Supabase SQL Editor (creates policies for authenticated uploads).`
      );
    }
    if (/payload|size|too large|entity too large/i.test(msg)) {
      throw new Error(
        `File is too large for storage. Max PDF size is 100MB. (${msg})`
      );
    }
    throw new Error(msg);
  }

  onProgress?.(90);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data?.publicUrl) {
    throw new Error("Upload succeeded but public URL could not be generated.");
  }

  onProgress?.(100);
  return data.publicUrl;
}
