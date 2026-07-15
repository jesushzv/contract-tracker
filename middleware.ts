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
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/onboarding");

  if (isProtectedPath && !hasAuthCookie && !isDemo) {
    // Redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const response = NextResponse.next();

  // If the request had ?demo=true and the cookie is not set, set it
  if (hasDemoParam && !hasDemoCookie) {
    response.cookies.set("demo_mode", "true", { path: "/" });
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};
