import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Allowed emails for manager access
const ALLOWED_EMAILS = [
  "thanh.ha@rally-go.com", 
  "tuan.bui@rally-go.com", 
  "hoang.nguyen@rally-go.com"
];

export async function GET(req: Request) {
  const session = await auth();
  const userEmail = session?.user?.email?.trim().toLowerCase();
  


//   if (!userEmail || !ALLOWED_EMAILS.includes(userEmail)) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }
  

  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  const projectKey = process.env.JIRA_PROJECT_KEY || "RAL";

  if (!host || !email || !apiToken) {
    console.error("Manager Route - Misconfigured Env");
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
        console.error("Manager Route - Failed to fetch fields:", fieldsResponse.status, fieldsResponse.statusText);
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

    console.log("Manager Route - Generated JQL:", jql);

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
        console.error("Manager Route - Failed to fetch issues. Status:", issuesResponse.status);
        console.error("Manager Route - Jira Error Body:", errorBody);
        throw new Error(`Failed to fetch issues: ${errorBody}`);
    }
    const issuesData = await issuesResponse.json();
    
    const tickets = issuesData.issues.map((issue: any) => ({
        id: issue.id,
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        type: issue.fields.issuetype?.name || "Unknown",
        assignee: {
            displayName: issue.fields.assignee?.displayName || "Unassigned",
            avatarUrl: issue.fields.assignee?.avatarUrls?.["48x48"] || issue.fields.assignee?.avatarUrls?.["32x32"] || null
        },
        url: `https://${host}/browse/${issue.key}`,
        updated: issue.fields.updated
    }));


    // 3. Fetch Pages (Confluence)
    // "no labels" isn't directly supported in Cloud CQL as "label is empty"
    // 3. Fetch Pages (Confluence)
    const cql = encodeURIComponent(`space = "${projectKey}" AND type = "page" order by lastModified desc`);
    // Note: We don't need expand=history.createdBy if we are just getting accountId? 
    // Actually we need accountId from somewhere. history.createdBy gives it.
    const cqlUrl = `https://${host}/wiki/rest/api/content/search?cql=${cql}&limit=50&expand=history.lastUpdated,history.createdBy,metadata.labels,ancestors`;
    
    console.log("Manager Route - Fetching Pages with CQL:", decodeURIComponent(cql));

    const pagesResponse = await fetch(cqlUrl, { headers, cache: "no-store" });
    
    const pages = [];
    if (pagesResponse.ok) {
        const pagesData = await pagesResponse.json();
        
        const rawPages = pagesData.results.filter((page: any) => page.metadata?.labels?.results?.length === 0);

        // Collect unique account IDs
        const accountIds = Array.from(new Set(rawPages.map((p: any) => p.history?.createdBy?.accountId).filter(Boolean)));
        
        // Fetch avatars from Jira (Bulk)
        let avatarMap: Record<string, string> = {};
        if (accountIds.length > 0) {
            try {
                // Jira Bulk User API
                // param is accountId=id1&accountId=id2...
                const queryParams = accountIds.map(id => `accountId=${id}`).join("&");
                const usersResponse = await fetch(`https://${host}/rest/api/3/user/bulk?${queryParams}`, { headers, cache: "force-cache" });
                
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    
                    // Handle both array (direct list) and paginated object ({ values: [...] })
                    const userList = Array.isArray(usersData) ? usersData : (usersData.values || []);
                    
                    if (Array.isArray(userList)) {
                        userList.forEach((u: any) => {
                            avatarMap[u.accountId] = u.avatarUrls?.["48x48"] || u.avatarUrls?.["32x32"];
                        });
                    } else {
                        console.error("Manager Route - Unexpected Jira Bulk User response structure:", JSON.stringify(usersData, null, 2));
                    }
                } else {
                    console.error("Manager Route - Failed to bulk fetch users:", usersResponse.status);
                }
            } catch (err) {
                console.error("Manager Route - Error fetching bulk users:", err);
            }
        }

        const mappedPages = rawPages.map((page: any) => {
                const ancestors = page.ancestors || [];
                const parent = ancestors.length > 0 ? ancestors[ancestors.length - 1] : null;
                const createdBy = page.history?.createdBy;
                const accountId = createdBy?.accountId;

                return {
                    id: page.id,
                    title: page.title,
                    parent: parent?.title || null,
                    url: `https://${host}/wiki${page._links.webui}`,
                    updated: page.history?.lastUpdated?.when,
                    author: {
                        displayName: createdBy?.displayName || "Unknown",
                        avatarUrl: (accountId && avatarMap[accountId]) ? avatarMap[accountId] : null
                    }
                };
             });
            
        pages.push(...mappedPages);
    } else {
         const errorBody = await pagesResponse.text();
         console.error("Manager Route - Pages Error Body:", errorBody);
    }

    return NextResponse.json({ tickets, pages });

  } catch (error: any) {
    console.error("Manager API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
