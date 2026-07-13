import { createClient } from "@/lib/supabase/server";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";
import type { User } from "@supabase/supabase-js";

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export async function getSessionUser(): Promise<User | null> {
  if (!hasSupabaseEnv()) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

/**
 * Require an authenticated admin user for mutations.
 * In demo mode (dev only), returns a synthetic user.
 */
export async function requireAdmin(): Promise<{ id: string; email?: string }> {
  if (isDemoMode()) {
    return { id: "demo-admin", email: "demo@localhost" };
  }

  if (!hasSupabaseEnv()) {
    throw new AuthError(
      "Server is not configured. Set Supabase environment variables.",
      503
    );
  }

  const user = await getSessionUser();
  if (!user) {
    throw new AuthError("Authentication required", 401);
  }

  return { id: user.id, email: user.email };
}
