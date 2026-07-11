import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { cookies, nextUrl } = request;

  // Check if we are bypassing auth for staging preview or if ?demo=true is present
  const isDemo = nextUrl.searchParams.get("demo") === "true";

  // Find any Supabase auth token cookie
  const hasAuthCookie = cookies.getAll().some((cookie) => 
    cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token")
  );

  const isProtectedPath = 
    nextUrl.pathname.startsWith("/dashboard") ||
    nextUrl.pathname.startsWith("/contracts") ||
    nextUrl.pathname.startsWith("/admin") ||
    nextUrl.pathname.startsWith("/onboarding");

  if (isProtectedPath && !hasAuthCookie && !isDemo) {
    // Redirect to login page
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/contracts/:path*",
    "/admin/:path*",
    "/onboarding/:path*",
  ],
};
