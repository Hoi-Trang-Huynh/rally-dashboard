import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userEmail = session.user.email;

  const host = process.env.JIRA_HOST;
  const sysEmail = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!host || !sysEmail || !apiToken) {
    return NextResponse.json({
      tickets: [],
      error: "Jira API not configured. Add JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN to .env",
    });
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${sysEmail}:${apiToken}`).toString("base64")}`;
    
    // Resolve user's Jira Account ID
    let accountId = null;
    const userRes = await fetch(`https://${host}/rest/api/3/user/search?query=${encodeURIComponent(userEmail)}`, {
        headers: {
            Authorization: authHeader,
            Accept: "application/json"
        },
        cache: "force-cache", // Cache the user lookup? Or maybe default nextjs fetch cache
        next: { revalidate: 3600 } // Cache user ID lookup for 1 hour to save API calls
    });

    if (userRes.ok) {
        const users = await userRes.json();
        if (users && users.length > 0) {
            accountId = users[0].accountId;
        }
    }

    if (!accountId) {
        return NextResponse.json({ issues: [] });
    }

    const projectKey = process.env.JIRA_PROJECT_KEY || "RAL";
    
    // JQL: Assignee is the authenticated user, Due Date is within next 7 days, Status not Done
    const jql = `project = ${projectKey} AND assignee = "${accountId}" AND duedate >= startOfDay() AND duedate <= startOfDay("+7d") AND statusCategory != Done ORDER BY duedate ASC`;
    
    console.log("Blockers JQL:", jql);

    const response = await fetch(
      `https://${host}/rest/api/3/search/jql`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql,
          maxResults: 10,
          fields: ["key", "summary", "status", "priority", "duedate", "assignee", "reporter"]
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Jira Blockers API Failed (${response.status}):`, errorBody);
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json();
    
    const tickets = data.issues?.map((issue: Record<string, unknown>) => {
      const fields = issue.fields as Record<string, unknown>;
      const reporter = fields?.reporter as { displayName?: string; avatarUrls?: Record<string, string> } | null;
      const priority = fields?.priority as { name?: string; iconUrl?: string } | null;
      const duedate = fields?.duedate as string | null;
      
      // Calculate days until due
      let daysUntilDue = 0;
      if (duedate) {
        const due = new Date(duedate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        due.setHours(0, 0, 0, 0);
        daysUntilDue = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      }
      
      const avatarUrl = reporter?.avatarUrls?.["48x48"] || reporter?.avatarUrls?.["32x32"] || reporter?.avatarUrls?.["24x24"];
      
      return {
        id: issue.id,
        key: issue.key,
        summary: fields?.summary,
        status: (fields?.status as { name?: string })?.name,
        priority: priority?.name || "Medium",
        duedate: duedate,
        daysUntilDue: daysUntilDue,
        updated: duedate || new Date().toISOString(), 
        url: `https://${host}/browse/${issue.key}`,
        source: 'jira',
        assignee: {
          displayName: reporter?.displayName || "Unknown",
          avatarUrl: avatarUrl
        },
      };
    }) || [];

    return NextResponse.json({ issues: tickets }); // Return 'issues' to match JiraFeedCard expectation (it expects { issues: [] })
  } catch (error) {
    console.error("Jira API error:", error);
    return NextResponse.json({
      tickets: [],
      error: "Failed to fetch Jira data",
    });
  }
}
