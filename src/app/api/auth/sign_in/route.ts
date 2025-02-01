import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Login request:', body);

    const response = await fetch('https://app.conversate.us/auth/sign_in', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log('Response:', {
      status: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      data,
    });

    // Create response headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Forward auth headers
    const authHeaders = [
      'access-token',
      'client',
      'uid',
      'expiry',
      'token-type'
    ];

    authHeaders.forEach(header => {
      const value = response.headers.get(header);
      if (value) {
        headers.set(header, value);
        console.log(`Setting ${header}:`, value);
      }
    });

    console.log('Response data:', JSON.stringify(data, null, 2));
    return new NextResponse(JSON.stringify(data), {
      status: response.status,
      headers,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}