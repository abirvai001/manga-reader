/**
 * Environment configuration for YourManga.EN
 */

function truthy(v: string | undefined): boolean {
  return v === "1" || v === "true" || v === "yes";
}

function clean(v: string | undefined): string {
  return (v ?? "").trim().replace(/^["']|["']$/g, "");
}

export function getSupabaseUrl(): string {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabaseAnonKey(): string {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** True only when both URL and anon key look usable. */
export function hasSupabaseEnv(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return false;
  if (url.includes("your-project") || url.includes("placeholder")) return false;
  if (!url.includes("supabase.co") && !url.includes("localhost")) return false;
  // JWT-shaped anon key (or longer secret)
  if (key.length < 20) return false;
  return true;
}

/**
 * Demo mode: mock data + open admin.
 * Off automatically when real Supabase env is present (unless ALLOW_DEMO_MODE=true).
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
      "Production requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
}

export const UPLOAD_LIMITS = {
  pdf: {
    maxBytes: 100 * 1024 * 1024,
    mimeTypes: ["application/pdf"] as const,
    extensions: [".pdf"] as const,
  },
  cover: {
    maxBytes: 5 * 1024 * 1024,
    mimeTypes: ["image/jpeg", "image/png", "image/webp"] as const,
    extensions: [".jpg", ".jpeg", ".png", ".webp"] as const,
  },
  ad: {
    maxBytes: 3 * 1024 * 1024,
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
