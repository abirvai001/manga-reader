import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { hasSupabaseEnv, isDemoMode } from "./env";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** @deprecated Prefer hasSupabaseEnv / isDemoMode from @/lib/env */
export function isSupabaseConfigured(): boolean {
  return hasSupabaseEnv();
}

export { hasSupabaseEnv, isDemoMode };
