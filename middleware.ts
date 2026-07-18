import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { cookies, nextUrl } = request;

  // Check if we are bypassing auth if ?demo=true is present or if demo_mode=true cookie exists
  const hasDemoParam = nextUrl.searchParams.get("demo") === "true";
  const hasDemoCookie = cookies.get("demo_mode")?.value === "true";
  const isDemo = hasDemoParam || hasDemoCookie;

  // Find any Supabase auth token cookie
  const hasAuthCookie = cookies.getAll().some((cookie) => {
    if (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")) {
      try {
        const val = JSON.parse(cookie.value);
        if (val === true || val === "true") return true;
        if (val && typeof val === "object" && val.access_token) return true;
      } catch {
        if (cookie.value === "true") return true;
      }
    }
    return false;
  });

  const isProtectedPath = 
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/contracts") ||
    nextUrl.pathname.startsWith("/admin");

  if (isProtectedPath && !hasAuthCookie && !isDemo) {
    // Redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Admin API protection (except the verify endpoint which issues the cookie)
  const isAdminApi = nextUrl.pathname.startsWith("/api/admin") && !nextUrl.pathname.startsWith("/api/admin/verify");
  if (isAdminApi && !isDemo) {
    const hasAdminSession = cookies.get("admin_session")?.value;
    if (!hasAdminSession) {
      return NextResponse.json({ error: "Admin session required" }, { status: 403 });
    }
  }

  const response = NextResponse.next();

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
