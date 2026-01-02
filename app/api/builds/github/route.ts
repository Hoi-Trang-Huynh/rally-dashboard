import { successResponse, errorResponse } from "@/lib/api-utils";
import { BuildInfo, BuildStatus } from "@/types";

const GH_TOKEN = process.env.GH_TOKEN;
const GH_OWNER = process.env.GH_OWNER || "Hoi-Trang-Huynh";

const REPOS = [
  "rally-dashboard",
  "rally-backend-api",
  "rally-backend-realtime",
  "rally-structurizr"
];

interface RepoResults {
    repo: string;
    runs: BuildInfo[];
    error?: boolean;
    total_count?: number;
}

export async function GET() {
  if (!GH_TOKEN) {
    return errorResponse("GH_TOKEN is not defined", 500);
  }

  try {
    const allBuilds = await Promise.all(
        REPOS.map(async (repo): Promise<RepoResults> => {
            try {
                const res = await fetch(`https://api.github.com/repos/${GH_OWNER}/${repo}/actions/runs?per_page=5`, {
                    headers: {
                        "Authorization": `Bearer ${GH_TOKEN}`,
                        "Accept": "application/vnd.github.v3+json",
                        "X-GitHub-Api-Version": "2022-11-28"
                    },
                    next: { revalidate: 60 } // Cache for 1 minute
                });

                if (!res.ok) {
                     console.error(`Failed to fetch builds for ${repo}: ${res.status}`);
                     return { repo, error: true, runs: [] };
                }

                const data = await res.json();
                
                const runs: BuildInfo[] = data.workflow_runs.map((run: any) => {
                    // Calculate duration in seconds
                    let duration = 0;
                    if (run.run_started_at && run.updated_at) {
                        const start = new Date(run.run_started_at).getTime();
                        const end = new Date(run.updated_at).getTime();
                        if (!isNaN(start) && !isNaN(end) && end > start) {
                            duration = Math.round((end - start) / 1000);
                        }
                    }

                    let normalizedStatus: BuildStatus = "unknown";
                    if (run.status === "completed") {
                        if (run.conclusion === "success") normalizedStatus = "success";
                        else if (run.conclusion === "failure") normalizedStatus = "failed";
                        else if (run.conclusion === "cancelled") normalizedStatus = "canceled";
                        else if (run.conclusion === "skipped") normalizedStatus = "skipped";
                    } else if (run.status === "in_progress") {
                        normalizedStatus = "running";
                    } else if (run.status === "queued") {
                        normalizedStatus = "queued";
                    }

                    return {
                        id: run.id,
                        appName: repo, // Using repo name as appName
                        status: run.status,
                        conclusion: run.conclusion,
                        normalizedStatus,
                        branch: run.head_branch,
                        commitHash: run.head_sha?.substring(0, 7),
                        commitMessage: run.head_commit?.message?.split('\n')[0], // First line only
                        author: run.actor?.login || run.triggering_actor?.login || "System",
                        authorAvatar: run.actor?.avatar_url || run.triggering_actor?.avatar_url,
                        url: run.html_url,
                        createdAt: run.created_at,
                        startedAt: run.run_started_at,
                        finishedAt: run.updated_at, // Approximate
                        duration,
                        workflow: run.name || run.display_title
                    };
                });

                return {
                    repo,
                    total_count: data.total_count || 0,
                    runs
                };
            } catch (error) {
                console.error(`Error fetching ${repo}:`, error);
                return { repo, error: true, runs: [] };
            }
        })
    );

    return successResponse({ builds: allBuilds });
  } catch (error: any) {
    return errorResponse(error.message, 500, error);
  }
}
