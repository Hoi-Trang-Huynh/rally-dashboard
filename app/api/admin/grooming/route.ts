import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Allowed emails for admin access
const ALLOWED_EMAILS = [
  "thanh.ha@rally-go.com", 
  "tuan.bui@rally-go.com", 
  "hoang.nguyen@rally-go.com"
];

export async function GET(req: Request) {
  const session = await auth();
  const userEmail = session?.user?.email?.trim().toLowerCase();
  


  if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  

  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY || "RAL";

  if (!host || !email || !apiToken) {
    console.error("Admin Route - Misconfigured Env");
    return NextResponse.json({ error: "Misconfigured Jira Env" }, { status: 500 });
  }

  const token = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const headers = {
    Authorization: `Basic ${token}`,
    Accept: "application/json",
  };

  try {
    // 1. Fetch Field IDs dynamically
    const fieldsResponse = await fetch(`https://${host}/rest/api/3/field`, { headers, cache: "force-cache" }); 
    if (!fieldsResponse.ok) {
        console.error("Admin Route - Failed to fetch fields:", fieldsResponse.status, fieldsResponse.statusText);
        throw new Error("Failed to fetch fields");
    }
    
    // ... rest of the code logic is unchanged but ensure variables are accessible
    const fields = await fieldsResponse.json();
    
    // Find IDs
    const findFieldId = (namePart: string) => {
        const field = fields.find((f: any) => f.name.toLowerCase().includes(namePart.toLowerCase()));
        return field?.id; 
    };

    const spId = findFieldId("Story Points");
    const acId = findFieldId("Acceptance Criteria");
    const devId = findFieldId("Developer"); 

    // Construct JQL
    // "missing description, acceptance criteria, no labels, missing due date, missing story point and developer field"
    // Note: 'cf[id] is EMPTY' syntax
    
    // We combine conditions with OR to find ANY missing item? 
    // "missing some key fields" implies if ANY is missing, show it.
    
    let jql = `project = ${projectKey} AND (description is EMPTY OR labels is EMPTY OR duedate is EMPTY`;
    
    if (spId) jql += ` OR ${spId} is EMPTY`;
    if (acId) jql += ` OR ${acId} is EMPTY`;
    if (devId) jql += ` OR ${devId} is EMPTY`;
    
    jql += `) AND statusCategory != Done ORDER BY updated DESC`;

    console.log("Admin Route - Generated JQL:", jql);

    // 2. Fetch Issues
    const issuesResponse = await fetch(
        `https://${host}/rest/api/3/search/jql`,
        { 
            method: "POST",
            headers: {
                ...headers,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                jql,
                maxResults: 20,
                fields: ["key", "summary", "status", "priority", "assignee", "updated", "issuetype"]
            }),
            cache: "no-store",
        }
    );
    
    if (!issuesResponse.ok) {
        const errorBody = await issuesResponse.text();
        console.error("Admin Route - Failed to fetch issues. Status:", issuesResponse.status);
        console.error("Admin Route - Jira Error Body:", errorBody);
        throw new Error(`Failed to fetch issues: ${errorBody}`);
    }
    const issuesData = await issuesResponse.json();
    
    const tickets = issuesData.issues.map((issue: any) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        type: issue.fields.issuetype?.name || "Unknown",
        assignee: issue.fields.assignee?.displayName || "Unassigned",
        url: `https://${host}/browse/${issue.key}`,
        updated: issue.fields.updated
    }));


    // 3. Fetch Pages (Confluence)
    // "no labels" isn't directly supported in Cloud CQL as "label is empty"
    // Workaround: Fetch recent pages in space and filter in memory for those with 0 labels.
    const cql = encodeURIComponent(`space = "${projectKey}" AND type = "page" order by lastModified desc`);
    const cqlUrl = `https://${host}/wiki/rest/api/content/search?cql=${cql}&limit=50&expand=history.lastUpdated,metadata.labels`;
    
    console.log("Admin Route - Fetching Pages with CQL:", decodeURIComponent(cql));
    console.log("Admin Route - Confluence URL:", cqlUrl);

    const pagesResponse = await fetch(
        cqlUrl,
        { headers, cache: "no-store" }
    );
    
    console.log("Admin Route - Pages Response Status:", pagesResponse.status);

    const pages = [];
    if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        
        // Filter in memory for pages with NO labels
        const mappedPages = pagesData.results
            .filter((page: any) => page.metadata?.labels?.results?.length === 0)
            .map((page: any) => ({
                id: page.id,
                title: page.title,
                url: `https://${host}/wiki${page._links.webui}`,
                updated: page.history?.lastUpdated?.when,
                author: page.history?.createdBy?.displayName
            }));
            
        pages.push(...mappedPages);
    } else {
         const errorBody = await pagesResponse.text();
         console.error("Admin Route - Pages Error Body:", errorBody);
    }

    return NextResponse.json({ tickets, pages });

  } catch (error: any) {
    console.error("Admin API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
