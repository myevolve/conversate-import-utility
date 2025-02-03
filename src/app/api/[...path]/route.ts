import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api", "");
  const url = `https://app.conversate.us${path}`;

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  // Forward auth headers
  const accessToken = request.headers.get("access-token");
  const client = request.headers.get("client");
  const uid = request.headers.get("uid");
  const expiry = request.headers.get("expiry");
  const tokenType = request.headers.get("token-type");

  if (accessToken) headers.set("access-token", accessToken);
  if (client) headers.set("client", client);
  if (uid) headers.set("uid", uid);
  if (expiry) headers.set("expiry", expiry);
  if (tokenType) headers.set("token-type", tokenType);

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
    headers: {
      "access-token": response.headers.get("access-token") || "",
      client: response.headers.get("client") || "",
      uid: response.headers.get("uid") || "",
      expiry: response.headers.get("expiry") || "",
      "token-type": response.headers.get("token-type") || "",
    },
  });
}

export async function POST(request: NextRequest) {
  const path = request.nextUrl.pathname.replace("/api", "");
  const url = `https://app.conversate.us${path}`;
  const body = await request.json();

  const headers = new Headers();
  headers.set("Content-Type", "application/json");
  headers.set("Accept", "application/json");

  // Forward auth headers
  const accessToken = request.headers.get("access-token");
  const client = request.headers.get("client");
  const uid = request.headers.get("uid");
  const expiry = request.headers.get("expiry");
  const tokenType = request.headers.get("token-type");

  if (accessToken) headers.set("access-token", accessToken);
  if (client) headers.set("client", client);
  if (uid) headers.set("uid", uid);
  if (expiry) headers.set("expiry", expiry);
  if (tokenType) headers.set("token-type", tokenType);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
    headers: {
      "access-token": response.headers.get("access-token") || "",
      client: response.headers.get("client") || "",
      uid: response.headers.get("uid") || "",
      expiry: response.headers.get("expiry") || "",
      "token-type": response.headers.get("token-type") || "",
    },
  });
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
