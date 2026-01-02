import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import { BuildInfo, BuildStatus } from "@/types";

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
    return errorResponse("CODEMAGIC_TOKEN is not defined", 500);
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
    const enrichedBuilds: BuildInfo[] = await Promise.all(builds.map(async (summaryBuild: any) => {
        let build = summaryBuild;
        
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

                    if (detailData.build) {
                         build = detailData.build;
                    } else {
                         build = detailData;
                    }

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
        
        const duration = build.duration || calculateDuration(build.startedAt || build.started_at, build.finishedAt || build.finished_at);
        const branch = build.branch;
        const version = build.tag || build.version;
        const status = build.status;
        
        // Map status to normalized status
        let normalizedStatus: BuildStatus = "unknown";
        if (status === "finished") normalizedStatus = "success"; // Codemagic "finished" usually means success
        else if (status === "failed") normalizedStatus = "failed";
        else if (status === "canceled") normalizedStatus = "canceled";
        else if (status === "building" || status === "running") normalizedStatus = "running";
        else if (status === "queued" || status === "preparing") normalizedStatus = "queued";
        
        // Handle "finished" but with error? Codemagic status is simpler.

        return {
            id: build._id || build.id,
            appId: build.appId,
            appName: build.config?.name || build.workflowName || build.app?.name || build.appName || "Rally App",
            status: build.status,
            normalizedStatus,
            branch,
            version,
            workflow: build.fileWorkflowId || build.workflowId || "default",
            startedAt: build.startedAt || build.started_at,
            startedBy: build.startedBy,
            createdAt: build.createdAt,
            finishedAt: build.finishedAt || build.finished_at,
            duration: typeof duration === 'number' ? duration : undefined,
            commitHash: build.commit?.hash?.substring(0, 7), // Short hash
            commitMessage: build.commit?.commitMessage?.split('\n')[0], // First line only
            author: build.commit?.authorName || "System",
            authorAvatar: build.commit?.authorAvatarUrl,
            instanceType: build.instanceType?.replace(/_/g, ' '), // e.g. "linux x2"
            mainArtifact: artifact ? {
                name: artifact.name,
                url: artifact.url,
                type: artifact.type,
                size: artifact.size
            } : undefined,
            artifacts: build.artifacts?.map((a: any) => ({ 
                name: a.name, 
                type: a.type, 
                url: a.url, 
                size: a.size 
            }))
        };
    }));

    return successResponse({ 
        builds: enrichedBuilds,
        pagination: { page, limit }
    });

  } catch (error: any) {
    return errorResponse(error.message, 500, error);
  }
}
