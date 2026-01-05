import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-utils";

// GET: Search Jira issues for autocomplete
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  console.log("[Jira Search] Query received:", query);

  if (!query || query.length < 2) {
    console.log("[Jira Search] Query too short, returning empty");
    return successResponse({ issues: [] });
  }

  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!host || !email || !apiToken) {
    console.error("[Jira Search] Missing env vars: JIRA_HOST, JIRA_EMAIL, or JIRA_API_TOKEN");
    return errorResponse("Jira configuration missing", 500);
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  try {
    // Search for issues with JQL
    // Query can be a key like "RAL-123" or text to search in summary
    const isKeySearch = /^[A-Z]+-\d*$/i.test(query);
    
    let jql: string;
    if (isKeySearch) {
      // Search by key prefix - use = for exact key match or key ~ for partial
      jql = `key = "${query}" OR key ~ "${query}" ORDER BY updated DESC`;
    } else {
      // Search in summary
      jql = `summary ~ "${query}*" OR key ~ "${query}*" ORDER BY updated DESC`;
    }

    const url = `https://${host}/rest/api/3/search/jql`;
    
    console.log("[Jira Search] JQL:", jql);
    
    // Use POST with new /search/jql endpoint
    const response = await fetch(url, { 
      method: "POST",
      headers: { 
        ...headers, 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        jql,
        maxResults: 10,
        fields: ["key", "summary", "reporter", "assignee", "status", "priority", "issuetype"],
      }),
      cache: "no-store" 
    });

    console.log("[Jira Search] Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Jira Search] API Failed:", response.status, errorText);
      return successResponse({ issues: [] });
    }

    const data = await response.json();
    
    console.log("[Jira Search] Found issues:", data.issues?.length || 0);
    
    const issues = (data.issues || []).map((issue: any) => ({
      key: issue.key,
      summary: issue.fields?.summary || "",
      status: issue.fields?.status?.name || "",
      statusColor: issue.fields?.status?.statusCategory?.colorName || "default",
      priority: issue.fields?.priority?.name || "",
      priorityIcon: issue.fields?.priority?.iconUrl || "",
      issueType: issue.fields?.issuetype?.name || "",
      issueTypeIcon: issue.fields?.issuetype?.iconUrl || "",
      reporter: issue.fields?.reporter ? {
        name: issue.fields.reporter.displayName,
        avatar: issue.fields.reporter.avatarUrls?.["24x24"] || "",
      } : null,
      assignee: issue.fields?.assignee ? {
        name: issue.fields.assignee.displayName,
        avatar: issue.fields.assignee.avatarUrls?.["24x24"] || "",
      } : null,
    }));

    return successResponse({ issues });
  } catch (error: any) {
    console.error("[Jira Search] Error:", error);
    return successResponse({ issues: [] }); // Graceful fallback
  }
}
