import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Login request:", body);

    const response = await fetch("https://app.conversate.us/auth/sign_in", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Origin: "https://app.conversate.us",
        Referer: "https://app.conversate.us/app/login",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log("Response:", {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    });

    // Create response
    const headers = new Headers();
    headers.set("Content-Type", "application/json");

    // Create response with cookies
    const res = NextResponse.json(data, {
      status: response.status,
      headers,
    });

    // Set auth cookies
    const authHeaders = [
      "access-token",
      "client",
      "uid",
      "expiry",
      "token-type",
    ];

    authHeaders.forEach((header) => {
      const value = response.headers.get(header);
      if (value) {
        res.cookies.set(header, value, {
          path: "/",
          httpOnly: false,
          sameSite: "lax",
        });
        console.log(`Setting cookie ${header}:`, value);
      }
    });

    console.log("Response data:", JSON.stringify(data, null, 2));
    return res;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
