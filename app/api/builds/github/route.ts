import { NextResponse } from "next/server";

const GH_TOKEN = process.env.GH_TOKEN;
const GH_OWNER = process.env.GH_OWNER || "Hoi-Trang-Huynh";
// Based on user info `Hoi-Trang-Huynh/rally-dashboard`, owner seems to be `Hoi-Trang-Huynh`.

const REPOS = [
  "rally-dashboard",
  "rally-backend-api",
  "rally-backend-realtime",
  "rally-structurizr"
];

export async function GET() {
  if (!GH_TOKEN) {
    return NextResponse.json({ error: "GH_TOKEN is not defined" }, { status: 500 });
  }

  try {
    const allBuilds = await Promise.all(
        REPOS.map(async (repo) => {
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
                return {
                    repo,
                    total_count: data.total_count || 0,
                    runs: data.workflow_runs.map((run: any) => {
                        // Calculate duration in seconds
                        let duration = 0;
                        if (run.run_started_at && run.updated_at) {
                            const start = new Date(run.run_started_at).getTime();
                            const end = new Date(run.updated_at).getTime();
                            if (!isNaN(start) && !isNaN(end) && end > start) {
                                duration = Math.round((end - start) / 1000);
                            }
                        }

                        return {
                            id: run.id,
                            name: run.name || run.display_title,
                            status: run.status,
                            conclusion: run.conclusion,
                            branch: run.head_branch,
                            commit: run.head_sha?.substring(0, 7),
                            message: run.head_commit?.message?.split('\n')[0], // First line only
                            author: run.actor?.login || run.triggering_actor?.login,
                            avatar: run.actor?.avatar_url || run.triggering_actor?.avatar_url,
                            url: run.html_url,
                            created_at: run.created_at,
                            updated_at: run.updated_at,
                            run_started_at: run.run_started_at,
                            duration
                        };
                    })
                };
            } catch (error) {
                console.error(`Error fetching ${repo}:`, error);
                return { repo, error: true, runs: [] };
            }
        })
    );

    return NextResponse.json({ builds: allBuilds });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
