import { z } from "zod";
import { PLACEMENT_ZONES } from "./types";
import { UPLOAD_LIMITS, type UploadBucket } from "./env";

const placementValues = PLACEMENT_ZONES.map((z) => z.value) as [
  string,
  ...string[],
];

export const mangaCreateSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  description: z.string().trim().max(5000).optional().default(""),
  category_id: z
    .union([z.string().uuid(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  cover_image_url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  // Allow https URLs and same-origin / storage paths used in production
  pdf_file_url: z
    .string()
    .min(1, "PDF URL required")
    .refine(
      (v) =>
        v.startsWith("https://") ||
        v.startsWith("http://") ||
        v.startsWith("data:"),
      "Valid PDF URL required"
    ),
  is_published: z.boolean().optional().default(true),
});

export const mangaUpdateSchema = mangaCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug"),
});

export const adCreateSchema = z.object({
  banner_image_url: z.string().min(1),
  placement_zone: z.enum(placementValues),
  target_url: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional()
    .transform((v) => (v ? v : null)),
  is_active: z.boolean().optional().default(true),
});

export const adUpdateSchema = z.object({
  id: z.string().uuid(),
  banner_image_url: z.string().url().optional(),
  placement_zone: z.enum(placementValues).optional(),
  target_url: z.string().url().nullable().optional(),
  is_active: z.boolean().optional(),
});

export function validateUploadFile(
  file: File,
  kind: "pdf" | "cover" | "ad"
): { ok: true } | { ok: false; error: string } {
  const limits =
    kind === "pdf"
      ? UPLOAD_LIMITS.pdf
      : kind === "cover"
        ? UPLOAD_LIMITS.cover
        : UPLOAD_LIMITS.ad;

  if (file.size <= 0) {
    return { ok: false, error: "Empty file" };
  }
  if (file.size > limits.maxBytes) {
    const mb = Math.round(limits.maxBytes / (1024 * 1024));
    return { ok: false, error: `File exceeds ${mb}MB limit` };
  }

  const name = file.name.toLowerCase();
  const hasExt = limits.extensions.some((ext) => name.endsWith(ext));
  const mimeOk =
    (limits.mimeTypes as readonly string[]).includes(file.type) ||
    // Some browsers send empty type
    (!file.type && hasExt);

  if (!mimeOk && !hasExt) {
    return {
      ok: false,
      error: `Invalid file type. Allowed: ${limits.extensions.join(", ")}`,
    };
  }

  return { ok: true };
}

export function bucketForKind(kind: "pdf" | "cover" | "ad"): UploadBucket {
  if (kind === "pdf") return "pdfs";
  if (kind === "cover") return "covers";
  return "ads";
}

export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_{2,}/g, "_")
    .slice(0, 120);
}
