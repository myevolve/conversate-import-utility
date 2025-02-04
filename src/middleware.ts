import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has("access-token");
  console.log("Middleware:", { isAuthenticated, cookies: request.cookies });
  const isImportPage = request.nextUrl.pathname.startsWith("/import");
  const isLoginPage = request.nextUrl.pathname === "/";

  if (isImportPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (isLoginPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/import", request.url));
  }

  // Clear cookies if not authenticated
  if (!isAuthenticated) {
    const response = NextResponse.next();
    response.cookies.delete("access-token");
    response.cookies.delete("client");
    response.cookies.delete("uid");
    response.cookies.delete("expiry");
    response.cookies.delete("token-type");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/import/:path*", "/api/:path*"],
};
