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
  const projectKey = process.env.JIRA_PROJECT_KEY || "RAL";

  if (!host || !sysEmail || !apiToken) {
    return NextResponse.json({
      issues: [],
      error: "Jira API not configured. Add JIRA_HOST, JIRA_EMAIL, and JIRA_API_TOKEN to .env",
    });
  }

  const authHeader = `Basic ${Buffer.from(`${sysEmail}:${apiToken}`).toString("base64")}`;
  const headers = {
    Authorization: authHeader,
    Accept: "application/json",
  };

  // Resolve user's Jira Account ID
  let accountId: string | null = null;
  try {
    const userRes = await fetch(`https://${host}/rest/api/3/user/search?query=${encodeURIComponent(userEmail)}`, {
        headers,
        cache: "force-cache",
        next: { revalidate: 3600 }
    });

    if (userRes.ok) {
        const users = await userRes.json();
        if (users && users.length > 0) {
            accountId = users[0].accountId;
        }
    }
  } catch (lookupError) {
      console.warn("User lookup failed", lookupError);
  }

  if (!accountId) {
      // If we can't identify the user in Jira, return empty list
      return NextResponse.json({ issues: [] });
  }

  const items: any[] = [];

  try {
    // 1. Fetch Jira Issues
    // Query: Tickets in project where (Assignee = Me OR Reporter = Me OR Comment mentions Me)
    const jql = `project = ${projectKey} AND (assignee = "${accountId}" OR reporter = "${accountId}" OR comment ~ "${accountId}") ORDER BY updated DESC`;

    // Request renderedFields to get HTML format for comments
    const jiraResponse = await fetch(
      `https://${host}/rest/api/3/search/jql`,
      { 
        method: "POST",
        headers: {
            ...headers,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            jql,
            maxResults: 10,
            fields: ["key", "summary", "status", "priority", "comment", "updated"],
            expand: "renderedFields"
        }),
        cache: "no-store", 
      }
    );

    if (jiraResponse.ok) {
      const data = await jiraResponse.json();
      
      // Flatten all comments from all issues, filtering to only show UNREPLIED comments
      data.issues?.forEach((issue: any) => {
        const fields = issue.fields;
        const renderedFields = issue.renderedFields;
        const issueComments = fields?.comment?.comments || [];
        const renderedComments = renderedFields?.comment?.comments || [];
        
        // Find the timestamp of the user's LAST comment on this specific issue
        const userLastCommentTime = issueComments
          .filter((c: any) => c.author?.accountId === accountId)
          .map((c: any) => new Date(c.created).getTime())
          .reduce((max: number, time: number) => Math.max(max, time), 0);
        
        // Filter to only comments by others that are NEWER than user's last comment
        issueComments.forEach((comment: any, index: number) => {
          // Skip my own comments
          if (comment.author?.accountId === accountId) return;
          
          // Skip if user has replied after this comment (per-issue tracking)
          const commentTime = new Date(comment.created).getTime();
          if (userLastCommentTime > 0 && commentTime <= userLastCommentTime) return;
          
          const renderedComment = renderedComments[index];
          const rawBody = renderedComment?.body || "";
          const cleanBody = decodeHtmlEntities(rawBody.replace(/<[^>]*>?/gm, "")).trim();
          
          const commenter = comment.author;
          const avatarUrl = commenter?.avatarUrls?.["48x48"] || commenter?.avatarUrls?.["32x32"] || commenter?.avatarUrls?.["24x24"];
          
          items.push({
            id: `${issue.id}-${comment.id}`, // Unique ID for each comment
            key: issue.key,
            summary: fields.summary,
            status: fields.status?.name,
            priority: fields.priority?.name || "Medium",
            updated: comment.created, // Use comment creation time for sorting
            url: `https://${host}/browse/${issue.key}?focusedCommentId=${comment.id}#comment-${comment.id}`,
            source: 'jira',
            assignee: {
                displayName: commenter?.displayName || "Unknown",
                avatarUrl: avatarUrl
            },
            lastComment: {
              author: commenter?.displayName,
              body: cleanBody || "Content not available",
              created: comment.created,
            },
          });
        });
      });
    } else {
       const errorText = await jiraResponse.text();
       console.error(`Jira API Error: ${jiraResponse.status} ${jiraResponse.statusText}`);
       console.error(`Error Details:`, errorText);
    }

    // 2. Fetch Confluence Pages (Best Effort)
    try {
        const cql = encodeURIComponent(`(creator = "${accountId}" OR text ~ "${accountId}") AND type = page order by lastModified desc`);
        
        const wikiResponse = await fetch(
            `https://${host}/wiki/rest/api/content/search?cql=${cql}&limit=5&expand=children.comment.history.createdBy,children.comment.body.view,history.lastUpdated,version`,
            { headers, cache: "no-store" }
        );

        if (wikiResponse.ok) {
            const data = await wikiResponse.json();
            
            // Flatten all comments from all pages, filtering out user's own comments
            data.results?.forEach((page: any) => {
                const comments = page.children?.comment?.results || [];
                
                comments.forEach((comment: any) => {
                    const author = comment.history?.createdBy;
                    
                    // Skip my own comments and system comments
                    if (author?.accountId === accountId) return;
                    if (author?.displayName === "Oauth" || author?.displayName === "System") return;
                    
                    const htmlBody = comment.body?.view?.value || "";
                    const textBody = htmlBody.replace(/<[^>]*>?/gm, '').trim(); 
                    const cleanBody = decodeHtmlEntities(textBody);
                    
                    let avatarUrl = author?.profilePicture?.path;
                    if (avatarUrl && !avatarUrl.startsWith("http")) {
                        avatarUrl = `https://${host}${avatarUrl}`;
                    }
                    
                    items.push({
                        id: `confluference-${page.id}-${comment.id}`,
                        key: "PAGE", 
                        summary: page.title,
                        status: page.status,
                        priority: "Medium", 
                        updated: comment.history?.createdDate,
                        url: `https://${host}/wiki${page._links.webui}?focusedCommentId=${comment.id}#comment-${comment.id}`,
                        source: 'confluence',
                        assignee: {
                            displayName: author?.displayName || "Unknown User",
                            avatarUrl: avatarUrl
                        },
                        lastComment: {
                           author: author?.displayName || "Unknown User",
                           body: cleanBody || "Content not available", 
                           created: comment.history?.createdDate,
                        }
                    });
                });
            });
        }
    } catch (wikiError) {
        console.warn("Confluence API not available or failed", wikiError);
    }

    // Sort combined items by updated desc
    items.sort((a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime());

    return NextResponse.json({ issues: items });
  } catch (error) {
    console.error("Jira/Confluence API error:", error);
    return NextResponse.json({
      issues: [],
      error: "Failed to fetch data",
    });
  }
}

function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  
  const entities: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&quot;': '"',
    '&lt;': '<',
    '&gt;': '>',
    '&apos;': "'",
    // Common accents
    '&Agrave;': 'À', '&Aacute;': 'Á', '&Acirc;': 'Â', '&Atilde;': 'Ã', '&Auml;': 'Ä', '&Aring;': 'Å',
    '&agrave;': 'à', '&aacute;': 'á', '&acirc;': 'â', '&atilde;': 'ã', '&auml;': 'ä', '&aring;': 'å',
    '&Ccedil;': 'Ç', '&ccedil;': 'ç',
    '&Egrave;': 'È', '&Eacute;': 'É', '&Ecirc;': 'Ê', '&Euml;': 'Ë',
    '&egrave;': 'è', '&eacute;': 'é', '&ecirc;': 'ê', '&euml;': 'ë',
    '&Igrave;': 'Ì', '&Iacute;': 'Í', '&Icirc;': 'Î', '&Iuml;': 'Ï',
    '&igrave;': 'ì', '&iacute;': 'í', '&icirc;': 'î', '&iuml;': 'ï',
    '&Ntilde;': 'Ñ', '&ntilde;': 'ñ',
    '&Ograve;': 'Ò', '&Oacute;': 'Ó', '&Ocirc;': 'Ô', '&Otilde;': 'Õ', '&Ouml;': 'Ö',
    '&ograve;': 'ò', '&oacute;': 'ó', '&ocirc;': 'ô', '&otilde;': 'õ', '&ouml;': 'ö',
    '&Ugrave;': 'Ù', '&Uacute;': 'Ú', '&Ucirc;': 'Û', '&Uuml;': 'Ü',
    '&ugrave;': 'ù', '&uacute;': 'ú', '&ucirc;': 'û', '&uuml;': 'ü',
    '&Yacute;': 'Ý', '&ý': 'ý', '&yuml;': 'ÿ',
  };

  return text
    .replace(/&[a-zA-Z0-9]+;/g, (entity) => {
        return entities[entity] || entity;
    })
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)));
}
