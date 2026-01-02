import { NextResponse } from "next/server";

interface CodeMagicBuild {
  _id: string;
  appId: string;
  workflowId: string;
  branch: string;
  status: string;
  startedAt: string;
  finishedAt?: string;
  index: number;
}

export async function GET() {
  const token = process.env.CODEMAGIC_API_TOKEN;
  const appId = process.env.CODEMAGIC_APP_ID;

  if (!token || !appId) {
    return NextResponse.json({
      status: "unknown",
      message: "CodeMagic API not configured. Add CODEMAGIC_API_TOKEN and CODEMAGIC_APP_ID to .env.local",
    });
  }

  try {
    const response = await fetch(
      `https://api.codemagic.io/builds?appId=${appId}&limit=1`,
      {
        headers: {
          "x-auth-token": token,
          "Content-Type": "application/json",
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`CodeMagic API error: ${response.status}`);
    }

    const data = await response.json();
    const latestBuild: CodeMagicBuild = data.builds?.[0];

    if (!latestBuild) {
      return NextResponse.json({
        status: "unknown",
        message: "No builds found",
      });
    }

    let status: "success" | "failure" | "building" | "unknown";
    let message: string;

    switch (latestBuild.status) {
      case "finished":
        status = "success";
        message = `Build #${latestBuild.index} completed successfully`;
        break;
      case "failed":
      case "canceled":
        status = "failure";
        message = `Build #${latestBuild.index} ${latestBuild.status}`;
        break;
      case "building":
      case "queued":
      case "preparing":
      case "fetching":
        status = "building";
        message = `Build #${latestBuild.index} in progress`;
        break;
      default:
        status = "unknown";
        message = `Build status: ${latestBuild.status}`;
    }

    return NextResponse.json({
      status,
      message,
      branch: latestBuild.branch,
      timestamp: latestBuild.finishedAt || latestBuild.startedAt,
      url: `https://codemagic.io/app/${appId}/build/${latestBuild._id}`,
    });
  } catch (error) {
    console.error("CodeMagic API error:", error);
    return NextResponse.json({
      status: "unknown",
      message: "Failed to fetch CodeMagic status",
    });
  }
}
