import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has("access-token");
  console.log("Middleware:", { isAuthenticated, cookies: request.cookies });
  const isImportPage = request.nextUrl.pathname.startsWith("/import");
  const isLoginPage = request.nextUrl.pathname === "/";
  const isApiRoute = request.nextUrl.pathname.startsWith("/api");

  // Don't redirect API routes
  if (isApiRoute) {
    return NextResponse.next();
  }

  // Clear cookies if not authenticated
  if (!isAuthenticated) {
    const response = NextResponse.next();
    response.cookies.delete("access-token");
    response.cookies.delete("client");
    response.cookies.delete("uid");
    response.cookies.delete("expiry");
    response.cookies.delete("token-type");

    // Redirect to login if trying to access import page
    if (isImportPage) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    return response;
  }

  // Redirect to import if already authenticated
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/import", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/import/:path*", "/api/:path*"],
};
