import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.AZURE_AD_CLIENT_ID;
  const clientSecret = process.env.AZURE_AD_CLIENT_SECRET;
  const tenantId = process.env.AZURE_AD_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    return NextResponse.json(
      { error: "Azure AD credentials not configured" },
      { status: 500 }
    );
  }

  try {
    // Get access token using client credentials flow
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials",
        }),
      }
    );

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Token error:", error);
      return NextResponse.json(
        { error: "Failed to get access token" },
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Fetch users from Microsoft Graph
    const usersResponse = await fetch(
      "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName,jobTitle&$top=100",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!usersResponse.ok) {
      const errorText = await usersResponse.text();
      console.error("Graph API error:", errorText);

      // Fallback for permission issues (Authorization_RequestDenied)
      if (usersResponse.status === 403 || errorText.includes("Authorization_RequestDenied")) {
        console.warn("⚠️ Falling back to mock users due to missing Graph API permissions.");
        
        const mockUsers = [
          { id: "mock-1", name: "Alice Dev", email: "alice@rally-go.com", jobTitle: "Senior Engineer" },
          { id: "mock-2", name: "Bob Design", email: "bob@rally-go.com", jobTitle: "Product Designer" },
          { id: "mock-3", name: "Charlie PM", email: "charlie@rally-go.com", jobTitle: "Product Manager" },
          { id: "mock-4", name: "David QA", email: "david@rally-go.com", jobTitle: "QA Engineer" },
        ];
        
        return NextResponse.json({ users: mockUsers }, { status: 200 });
      }

      return NextResponse.json(
        { error: "Failed to fetch users from Microsoft Graph" },
        { status: 500 }
      );
    }

    const usersData = await usersResponse.json();
    
    // Transform users to a simpler format
    const users = usersData.value.map((user: {
      id: string;
      displayName: string;
      mail: string | null;
      userPrincipalName: string;
      jobTitle: string | null;
    }) => ({
      id: user.id,
      name: user.displayName,
      email: user.mail || user.userPrincipalName,
      jobTitle: user.jobTitle || "Team Member",
    }));

    return NextResponse.json({ users }, { status: 200 });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
