/**
 * Environment configuration.
 * Demo mode is ONLY allowed in development, or when ALLOW_DEMO_MODE=true.
 * Production deployments must set Supabase credentials.
 */

function truthy(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "yes";
}

export function hasSupabaseEnv(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(
    url &&
      key &&
      !url.includes("your-project") &&
      !url.includes("placeholder")
  );
}

/**
 * Demo mode: mock data + open admin (no Supabase).
 * Enabled when Supabase is not configured, or ALLOW_DEMO_MODE=true.
 * For real production, set Supabase env vars (demo then turns off automatically).
 */
export function isDemoMode(): boolean {
  if (hasSupabaseEnv() && !truthy(process.env.ALLOW_DEMO_MODE)) {
    return false;
  }
  if (truthy(process.env.ALLOW_DEMO_MODE)) return true;
  return !hasSupabaseEnv();
}

export function isSupabaseConfigured(): boolean {
  return hasSupabaseEnv();
}

export function requireSupabaseInProduction(): void {
  if (process.env.NODE_ENV === "production" && !hasSupabaseEnv()) {
    throw new Error(
      "Production requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY. Set ALLOW_DEMO_MODE=true only for non-production demos."
    );
  }
}

export const UPLOAD_LIMITS = {
  pdf: {
    maxBytes: 100 * 1024 * 1024, // 100 MB
    mimeTypes: ["application/pdf"] as const,
    extensions: [".pdf"] as const,
  },
  cover: {
    maxBytes: 5 * 1024 * 1024, // 5 MB
    mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    extensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
  },
  ad: {
    maxBytes: 3 * 1024 * 1024, // 3 MB (GIF banners)
    mimeTypes: [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ] as const,
    extensions: [".jpg", ".jpeg", ".png", ".webp", ".gif"] as const,
  },
} as const;

export type UploadBucket = "pdfs" | "covers" | "ads";
