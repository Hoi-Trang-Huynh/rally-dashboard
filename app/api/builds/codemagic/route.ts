import { NextRequest, NextResponse } from "next/server";

const CODEMAGIC_TOKEN = process.env.CODEMAGIC_TOKEN;

// Calculate duration in seconds from start and finish timestamps
function calculateDuration(startedAt?: string, finishedAt?: string): number | null {
  if (!startedAt || !finishedAt) return null;
  
  const start = new Date(startedAt).getTime();
  const end = new Date(finishedAt).getTime();
  
  if (isNaN(start) || isNaN(end) || end < start) return null;
  
  return Math.round((end - start) / 1000); // Return seconds
}

export async function GET(request: NextRequest) {
  if (!CODEMAGIC_TOKEN) {
    return NextResponse.json({ error: "CODEMAGIC_TOKEN is not defined" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");

  try {
    const buildsRes = await fetch(`https://api.codemagic.io/builds?limit=${limit}&page=${page}`, {
        headers: {
            "x-auth-token": CODEMAGIC_TOKEN
        },
        cache: "no-store"
    });

    if (!buildsRes.ok) {
        throw new Error(`Codemagic API Error: ${buildsRes.status}`);
    }

    const buildsData = await buildsRes.json();
    
    let builds: any[] = [];
    if (buildsData.builds) {
        builds = buildsData.builds;
    } else if (Array.isArray(buildsData)) {
        builds = buildsData;
    } else if (buildsData.applications) {
        builds = buildsData.applications.flatMap((app: any) => app.builds || []);
    }

    // Safety fallback
    if (!builds || !Array.isArray(builds)) {
        builds = [];
    }
    
    // Fetch detailed info for each build to get artifacts
    const enrichedBuilds = await Promise.all(builds.map(async (summaryBuild: any) => {
        let build = summaryBuild;
        
        // Only fetch details if status is finished (optimization), or always? 
        // User said "for the artifact you need to fetch more data", artifacts exist mostly on finished builds.
        // Let's fetch for all to be safe and consistent.
        try {
            const buildId = summaryBuild.id || summaryBuild._id;
            if (buildId) {
                const detailRes = await fetch(`https://api.codemagic.io/builds/${buildId}`, {
                    headers: {
                        "x-auth-token": CODEMAGIC_TOKEN!
                    },
                    cache: "no-store"
                });
                
                if (detailRes.ok) {
                    const detailData = await detailRes.json();

                    // Codemagic API behavior:
                    // If fetching /builds/{id}, it often returns { build: { ... } } or just { ... }
                    // We check for the nested 'build' property first.
                    if (detailData.build) {
                         build = detailData.build;
                    } else {
                         build = detailData;
                    }

                    // Normalize 'artefacts' to 'artifacts' if present (API inconsistency)
                    if (build && (build as any).artefacts) {
                        build.artifacts = (build as any).artefacts;
                    }
                }
            }
        } catch (e) {
            console.error(`Failed to fetch details for build ${summaryBuild.id}:`, e);
        }

        // Try to find a mobile artifact (apk, ipa)
        const artifact = build.artifacts?.find((a: any) => 
            a.type === 'apk' || a.type === 'ipa' || a.name?.endsWith('.apk') || a.name?.endsWith('.ipa')
        );

        return {
            id: build._id || build.id,
            appId: build.appId,
            appName: build.config?.name || build.workflowName || build.app?.name || build.appName || "Rally App",
            status: build.status,
            branch: build.branch,
            version: build.tag || build.version,
            workflow: build.fileWorkflowId || build.workflowId || "default",
            started_at: build.startedAt || build.started_at,
            started_by: build.startedBy,
            created_at: build.createdAt,
            finished_at: build.finishedAt || build.finished_at,
            duration: build.duration || calculateDuration(build.startedAt || build.started_at, build.finishedAt || build.finished_at),
            commit_hash: build.commit?.hash?.substring(0, 7), // Short hash
            commit_message: build.commit?.commitMessage?.split('\n')[0], // First line only
            author_name: build.commit?.authorName,
            author_avatar: build.commit?.authorAvatarUrl,
            instance_type: build.instanceType?.replace(/_/g, ' '), // e.g. "linux x2"
            artifact: artifact ? {
                name: artifact.name,
                url: artifact.url, // Authenticated URL
            } : null,
            allArtifacts: build.artifacts?.map((a: any) => ({ 
                name: a.name, 
                type: a.type, 
                url: a.url, 
                size: a.size 
            }))
        };
    }));

    return NextResponse.json({ 
        builds: enrichedBuilds,
        pagination: { page, limit }
    });

  } catch (error: any) {
    console.error("Codemagic Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
