import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { accountId, contactId, labels } = await request.json();

  // Get auth headers from cookies
  const accessToken = request.cookies.get("access-token")?.value;
  const client = request.cookies.get("client")?.value;
  const uid = request.cookies.get("uid")?.value;

  if (!accessToken || !client || !uid) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Create labels first
  const createLabelsResponse = await fetch(
    `https://app.conversate.us/api/v1/accounts/${accountId}/labels`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
        client,
        uid,
      },
      body: JSON.stringify({
        labels: labels.map((label: string) => ({ title: label })),
      }),
    },
  );

  if (!createLabelsResponse.ok) {
    return NextResponse.json(
      { error: "Failed to create labels" },
      { status: createLabelsResponse.status },
    );
  }

  // Add labels to contact
  const addLabelsResponse = await fetch(
    `https://app.conversate.us/api/v1/accounts/${accountId}/contacts/${contactId}/labels`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken,
        client,
        uid,
      },
      body: JSON.stringify({
        labels,
      }),
    },
  );

  if (!addLabelsResponse.ok) {
    return NextResponse.json(
      { error: "Failed to add labels to contact" },
      { status: addLabelsResponse.status },
    );
  }

  return NextResponse.json({ success: true });
}
