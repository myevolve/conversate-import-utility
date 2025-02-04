import { NextRequest, NextResponse } from "next/server";

function getCorsHeaders() {
  return {
    "Access-Control-Allow-Origin": "http://localhost:53876",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Accept, Origin, Referer, access-token, client, uid, expiry, token-type",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Expose-Headers":
      "access-token, client, uid, expiry, token-type",
  };
}

function getAuthResponseHeaders(response: Response) {
  const headers = new Headers(getCorsHeaders());

  // Forward Set-Cookie headers
  const cookies = response.headers.getSetCookie();
  if (cookies.length > 0) {
    cookies.forEach((cookie) => {
      headers.append("Set-Cookie", cookie);
    });
  }

  // Forward auth headers
  const accessToken = response.headers.get("access-token");
  const client = response.headers.get("client");
  const uid = response.headers.get("uid");
  const expiry = response.headers.get("expiry");
  const tokenType = response.headers.get("token-type");

  if (accessToken) headers.set("access-token", accessToken);
  if (client) headers.set("client", client);
  if (uid) headers.set("uid", uid);
  if (expiry) headers.set("expiry", expiry);
  if (tokenType) headers.set("token-type", tokenType);

  return Object.fromEntries(headers.entries());
}

async function getAuthHeaders(request: NextRequest) {
  const cookies = request.cookies;
  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  // Forward auth headers from cookies
  const accessToken = cookies.get("access-token")?.value;
  const client = cookies.get("client")?.value;
  const uid = cookies.get("uid")?.value;
  const expiry = cookies.get("expiry")?.value;
  const tokenType = cookies.get("token-type")?.value;

  if (accessToken) headers.set("access-token", accessToken);
  if (client) headers.set("client", client);
  if (uid) headers.set("uid", uid);
  if (expiry) headers.set("expiry", expiry);
  if (tokenType) headers.set("token-type", tokenType);

  return headers;
}

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api", "");
  const url = `https://app.conversate.us${path}`;
  const headers = await getAuthHeaders(request);

  const response = await fetch(url, {
    method: "GET",
    headers,
    credentials: "include",
  });

  const data = await response.json();
  const responseHeaders = getAuthResponseHeaders(response);

  // Create response with auth headers
  const nextResponse = NextResponse.json(data, {
    status: response.status,
    headers: responseHeaders,
  });

  // Set cookies from auth headers
  const accessToken = response.headers.get("access-token");
  const client = response.headers.get("client");
  const uid = response.headers.get("uid");
  const expiry = response.headers.get("expiry");
  const tokenType = response.headers.get("token-type");

  if (accessToken) nextResponse.cookies.set("access-token", accessToken);
  if (client) nextResponse.cookies.set("client", client);
  if (uid) nextResponse.cookies.set("uid", uid);
  if (expiry) nextResponse.cookies.set("expiry", expiry);
  if (tokenType) nextResponse.cookies.set("token-type", tokenType);

  return nextResponse;
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api", "");
  const url = `https://app.conversate.us${path}`;
  const body = await request.json();
  const headers = await getAuthHeaders(request);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    credentials: "include",
  });

  const data = await response.json();
  const responseHeaders = getAuthResponseHeaders(response);

  // Create response with auth headers
  const nextResponse = NextResponse.json(data, {
    status: response.status,
    headers: responseHeaders,
  });

  // Set cookies from auth headers
  const accessToken = response.headers.get("access-token");
  const client = response.headers.get("client");
  const uid = response.headers.get("uid");
  const expiry = response.headers.get("expiry");
  const tokenType = response.headers.get("token-type");

  if (accessToken) nextResponse.cookies.set("access-token", accessToken);
  if (client) nextResponse.cookies.set("client", client);
  if (uid) nextResponse.cookies.set("uid", uid);
  if (expiry) nextResponse.cookies.set("expiry", expiry);
  if (tokenType) nextResponse.cookies.set("token-type", tokenType);

  return nextResponse;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(),
  });
}
