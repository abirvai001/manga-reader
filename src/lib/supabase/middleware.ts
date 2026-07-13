import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseEnv, isDemoMode } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { pathname } = request.nextUrl;

  const isAdminRoute =
    pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi =
    pathname.startsWith("/api/admin") ||
    pathname === "/api/ads/all" ||
    (pathname.startsWith("/api/") &&
      request.method !== "GET" &&
      !pathname.startsWith("/api/health"));

  // Demo mode: no real auth — allow admin UI for local demos only
  if (!hasSupabaseEnv()) {
    if (
      process.env.NODE_ENV === "production" &&
      !isDemoMode() &&
      (isAdminRoute || isAdminApi)
    ) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Server not configured" },
          { status: 503 }
        );
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("error", "not_configured");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect admin pages
  if (isAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in → skip login page
  if (pathname === "/admin/login" && user) {
    const dash = request.nextUrl.clone();
    dash.pathname = "/admin";
    dash.search = "";
    return NextResponse.redirect(dash);
  }

  return supabaseResponse;
}
