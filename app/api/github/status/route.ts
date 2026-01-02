import { NextResponse } from "next/server";

interface GitHubWorkflowRun {
  id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  status: string;
  conclusion: string | null;
  html_url: string;
  created_at: string;
  updated_at: string;
}

export async function GET() {
  const token = process.env.GH_TOKEN;
  const owner = process.env.GH_OWNER;
  const repo = process.env.GH_REPO;

  if (!token || !owner || !repo) {
    return NextResponse.json({
      status: "unknown",
      message: "GitHub API not configured. Add GH_TOKEN, GH_OWNER, and GH_REPO to .env.local",
    });
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?per_page=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
        },
        next: { revalidate: 30 }, // Cache for 30 seconds
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const data = await response.json();
    const latestRun: GitHubWorkflowRun = data.workflow_runs?.[0];

    if (!latestRun) {
      return NextResponse.json({
        status: "unknown",
        message: "No workflow runs found",
      });
    }

    let status: "success" | "failure" | "building" | "unknown";
    let message: string;

    if (latestRun.status === "in_progress" || latestRun.status === "queued") {
      status = "building";
      message = `Build in progress: ${latestRun.name}`;
    } else if (latestRun.conclusion === "success") {
      status = "success";
      message = `Latest build passed: ${latestRun.name}`;
    } else if (latestRun.conclusion === "failure") {
      status = "failure";
      message = `Build failed: ${latestRun.name}`;
    } else {
      status = "unknown";
      message = `Build status: ${latestRun.conclusion || latestRun.status}`;
    }

    return NextResponse.json({
      status,
      message,
      branch: latestRun.head_branch,
      commit: latestRun.head_sha.substring(0, 7),
      timestamp: latestRun.updated_at,
      url: latestRun.html_url,
    });
  } catch (error) {
    console.error("GitHub API error:", error);
    return NextResponse.json({
      status: "unknown",
      message: "Failed to fetch GitHub status",
    });
  }
}
