import { NextResponse } from "next/server";

export async function GET() {
  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!host || !email || !apiToken) {
    return NextResponse.json({
      tickets: [],
      error: "Jira API not configured. Add JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN to .env",
    });
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
    const projectKey = process.env.JIRA_PROJECT_KEY || "RAL";
    
    // JQL: Assignee is me, Due Date is within next 7 days (and not past), Status not Done
    // JQL: Assignee is me, Due Date is within next 7 days (and not past), Status not Done
    const jql = `project = ${projectKey} AND assignee = currentUser() AND duedate >= now() AND duedate <= 7d AND statusCategory != Done ORDER BY duedate ASC`;

    const response = await fetch(
      `https://${host}/rest/api/3/search/jql`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jql,
          maxResults: 10,
          fields: ["key", "summary", "status", "priority", "duedate", "assignee"]
        }),
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Jira Due-Soon API Failed (${response.status}):`, errorBody);
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json();
    
    const tickets = data.issues?.map((issue: Record<string, unknown>) => {
      const fields = issue.fields as Record<string, unknown>;
      return {
        id: issue.id,
        key: issue.key,
        summary: fields?.summary,
        status: (fields?.status as { name?: string })?.name,
        priority: (fields?.priority as { name?: string })?.name || "Medium",
        // Map due date to updated so it shows in the card date slot
        updated: fields?.duedate || new Date().toISOString(), 
        url: `https://${host}/browse/${issue.key}`,
        assignee: (fields?.assignee as { displayName?: string })?.displayName,
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
