import { NextResponse } from "next/server";

export async function GET() {
  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY || "RAL";

  if (!host || !email || !apiToken) {
    return NextResponse.json({
      releases: [],
      error: "Jira API not configured",
    });
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  try {
    // Fetch project versions (releases)
    const response = await fetch(
      `https://${host}/rest/api/3/project/${projectKey}/versions`,
      { headers, next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Jira Releases API Failed (${response.status}):`, errorBody);
      throw new Error(`Jira API error: ${response.status}`);
    }

    const versions = await response.json();
    
    // Parse and sort by version number
    const parseVer = (name: string) => {
      const match = name.match(/(\d+)\.(\d+)\.(\d+)/);
      return match ? [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])] : [0, 0, 0];
    };

    const releases = versions
      .map((version: any) => {
        let status = "Planned";
        if (version.released) {
          status = "Released";
        } else if (version.archived) {
          status = "Archived";
        } else if (version.startDate && new Date(version.startDate) <= new Date()) {
          status = "In Progress";
        }

        return {
          id: version.id,
          name: version.name,
          description: version.description || "",
          status,
          released: version.released,
          releaseDate: version.releaseDate,
          startDate: version.startDate,
          overdue: version.overdue || false,
          url: `https://${host}/projects/${projectKey}/versions/${version.id}`,
        };
      })
      .sort((a: any, b: any) => {
        const vA = parseVer(a.name);
        const vB = parseVer(b.name);
        for (let i = 0; i < 3; i++) {
          if (vA[i] !== vB[i]) return vA[i] - vB[i];
        }
        return 0;
      })
      .slice(0, 10); // Limit to 10

    return NextResponse.json({ releases });
  } catch (error) {
    console.error("Jira Releases API error:", error);
    return NextResponse.json({
      releases: [],
      error: "Failed to fetch releases",
    });
  }
}
