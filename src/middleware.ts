import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has("access-token");
  console.log("Middleware:", { isAuthenticated, cookies: request.cookies });
  const isImportPage = request.nextUrl.pathname.startsWith("/import");

  if (isImportPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isImportPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/import", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/import/:path*", "/api/:path*"],
};
