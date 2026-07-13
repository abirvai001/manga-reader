import { requireAdmin } from "@/lib/auth";
import { handleApiError, jsonError, jsonOk } from "@/lib/api";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import {
  bucketForKind,
  sanitizeFilename,
  validateUploadFile,
} from "@/lib/validation";
import { logger } from "@/lib/logger";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const form = await req.formData();
    const file = form.get("file");
    const kindRaw = String(form.get("kind") ?? "");

    if (!(file instanceof File)) {
      return jsonError("Missing file", 400);
    }
    if (kindRaw !== "pdf" && kindRaw !== "cover" && kindRaw !== "ad") {
      return jsonError("Invalid kind (pdf | cover | ad)", 400);
    }

    const validation = validateUploadFile(file, kindRaw);
    if (!validation.ok) {
      return jsonError(validation.error, 400);
    }

    // Demo: return a temporary object URL is not useful server-side;
    // use a data URL only for tiny files or reject with guidance.
    if (!hasSupabaseEnv() || isDemoMode()) {
      if (isDemoMode() && !hasSupabaseEnv()) {
        const buf = Buffer.from(await file.arrayBuffer());
        // Cap demo data URLs to 1.5MB to avoid huge payloads
        if (buf.length > 1.5 * 1024 * 1024) {
          return jsonError(
            "Demo mode: file too large for in-memory preview. Configure Supabase storage for real uploads.",
            400
          );
        }
        const b64 = buf.toString("base64");
        const url = `data:${file.type || "application/octet-stream"};base64,${b64}`;
        return jsonOk({ url, demo: true });
      }
      return jsonError("Storage not configured", 503);
    }

    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const bucket = bucketForKind(kindRaw);
    const safe = sanitizeFilename(file.name);
    const path = `${kindRaw}/${Date.now()}-${crypto.randomUUID()}-${safe}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
      contentType: file.type || undefined,
      cacheControl: "31536000",
      upsert: false,
    });

    if (error) {
      logger.error("upload failed", { error: error.message, bucket });
      return jsonError(error.message, 400);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    logger.info("file uploaded", { bucket, path });
    return jsonOk({ url: data.publicUrl, path, bucket });
  } catch (err) {
    return handleApiError(err, "POST /api/admin/upload");
  }
}
