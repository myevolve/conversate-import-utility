import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const isAuthenticated =
    request.cookies.get("isAuthenticated")?.value === "true";
  console.log("Middleware:", { isAuthenticated, cookies: request.cookies });
  const isImportPage = request.nextUrl.pathname.startsWith("/import");

  if (isImportPage && !isAuthenticated) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  if (!isImportPage && isAuthenticated) {
    return NextResponse.redirect(new URL("/import", request.url));
  }

  const response = NextResponse.next();

  // Add CORS headers
  response.headers.set(
    "Access-Control-Allow-Origin",
    "https://app.conversate.us",
  );
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,DELETE,OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Origin, Referer, access-token, client, uid, expiry, token-type",
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Expose-Headers",
    "access-token, client, uid, expiry, token-type",
  );

  return response;
}

export const config = {
  matcher: ["/", "/import/:path*"],
};
