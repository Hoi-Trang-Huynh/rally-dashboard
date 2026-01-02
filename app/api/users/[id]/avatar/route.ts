import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    return new NextResponse("Azure AD credentials not configured", { status: 500 });
  }

  try {
    // 1. Get Access Token
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    );

    if (!tokenResponse.ok) {
        // If we can't authenticate, return 404 or default image
        return new NextResponse(null, { status: 404 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch User Photo from Graph API
    // Endpoint: /users/{id}/photo/$value
    const photoResponse = await fetch(
      `https://graph.microsoft.com/v1.0/users/${id}/photo/$value`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!photoResponse.ok) {
       // No photo found for user, return 404 so frontend shows fallback
       return new NextResponse(null, { status: 404 });
    }

    // 3. Return the image data directly
    const buffer = await photoResponse.arrayBuffer();
    const headers = new Headers();
    headers.set("Content-Type", photoResponse.headers.get("Content-Type") || "image/jpeg");
    headers.set("Cache-Control", "public, max-age=86400"); // Cache for 24 hours

    return new NextResponse(buffer, { headers });

  } catch (error) {
    console.error("Error fetching user photo:", error);
    return new NextResponse(null, { status: 500 });
  }
}
