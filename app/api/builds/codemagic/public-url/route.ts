import { NextRequest, NextResponse } from "next/server";

const CODEMAGIC_TOKEN = process.env.CODEMAGIC_TOKEN;

export async function POST(request: NextRequest) {
  if (!CODEMAGIC_TOKEN) {
    return NextResponse.json({ error: "CODEMAGIC_TOKEN is not defined" }, { status: 500 });
  }

  try {
    const { artifactUrl } = await request.json();

    if (!artifactUrl) {
        return NextResponse.json({ error: "Missing artifactUrl" }, { status: 400 });
    }

    // According to docs: POST /artifacts/:secureFilename/public-url
    // where :secureFilename is the full path effectively, so we just append /public-url to the artifact URL
    const targetUrl = `${artifactUrl}/public-url`;

    const pubRes = await fetch(targetUrl, {
        method: 'POST',
        headers: {
            "x-auth-token": CODEMAGIC_TOKEN,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ expiresAt: Math.floor(Date.now() / 1000) + 3600 }) // 1 hour
    });
    
    if (!pubRes.ok) {
        throw new Error(`Failed to generate public URL: ${pubRes.status}`);
    }

    const pubData = await pubRes.json();
    return NextResponse.json({ url: pubData.url });

  } catch (error: any) {
    console.error("Artifact Public URL Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
