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
    // Query: Tickets in project where (Assignee = Me OR Comment mentions Me)
    const jql = `project = ${projectKey} AND (assignee = "${accountId}" OR comment ~ "${accountId}") ORDER BY updated DESC`;

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
            expand: ["renderedFields"]
        }),
        cache: "no-store", 
      }
    );

    if (jiraResponse.ok) {
      const data = await jiraResponse.json();
      
      const jiraItems = data.issues
        ?.filter((issue: any) => {
          const comments = issue.fields?.comment?.comments;
          if (!comments || comments.length === 0) return false;
          
          const lastComment = comments[comments.length - 1];
          // Needs reply if last comment author is NOT me
          // Using accountId comparison which is reliable
          return lastComment?.author?.accountId !== accountId;
        })
        .map((issue: any) => {
          const fields = issue.fields;
          const renderedFields = issue.renderedFields;
          const issueComments = fields?.comment?.comments || [];
          
          // Use rendered (HTML) comment for body text
          const renderedComments = renderedFields?.comment?.comments || [];
          const lastRenderedComment = renderedComments[renderedComments.length - 1];
          const lastComment = issueComments[issueComments.length - 1];
          
          const rawBody = lastRenderedComment?.body || "";
          const cleanBody = decodeHtmlEntities(rawBody.replace(/<[^>]*>?/gm, "")).trim();

          return {
            id: issue.id,
            key: issue.key,
            summary: fields.summary,
            status: fields.status?.name,
            priority: fields.priority?.name || "Medium",
            updated: fields.updated,
            // Link to specific comment
            url: `https://${host}/browse/${issue.key}?focusedCommentId=${lastComment?.id}#comment-${lastComment?.id}`,
            source: 'jira',
            lastComment: lastComment
              ? {
                  author: lastComment.author?.displayName,
                  body: cleanBody || "Content not available",
                  created: lastComment.created,
                }
              : undefined,
          };
        }) || [];
        
      items.push(...jiraItems);
    } else {
       console.error(`Jira API Error: ${jiraResponse.status} ${jiraResponse.statusText}`);
    }

    // 2. Fetch Confluence Pages (Best Effort)
    try {
        // Query: Pages created by Me OR text mentions Me
        const cql = encodeURIComponent(`(creator = "${accountId}" OR text ~ "${accountId}") AND type = page order by lastModified desc`);
        
        const wikiResponse = await fetch(
            `https://${host}/wiki/rest/api/content/search?cql=${cql}&limit=5&expand=children.comment.history,children.comment.body.view,history.lastUpdated,version`,
            { headers, cache: "no-store" }
        );

        if (wikiResponse.ok) {
            const data = await wikiResponse.json();
            const wikiItems = data.results
                ?.filter((page: any) => {
                    const comments = page.children?.comment?.results;
                    if (!comments || comments.length === 0) return false;
                    
                    const sortedComments = comments.sort((a: any, b: any) => 
                        new Date(a.history?.createdDate).getTime() - new Date(b.history?.createdDate).getTime()
                    );
                    const lastComment = sortedComments[sortedComments.length - 1];
                    
                    const author = lastComment?.history?.createdBy;
                    
                    // Check if last comment is by Me (using Account ID)
                    const isMe = author?.accountId === accountId;
                    if (isMe) return false;
                    
                     return author?.displayName !== "Oauth" && author?.displayName !== "System";
                })
                .map((page: any) => {
                    const comments = page.children?.comment?.results;
                     const sortedComments = comments.sort((a: any, b: any) => 
                        new Date(a.history?.createdDate).getTime() - new Date(b.history?.createdDate).getTime()
                    );
                    const lastComment = sortedComments[sortedComments.length - 1];
                    
                    const htmlBody = lastComment.body?.view?.value || "";
                    const textBody = htmlBody.replace(/<[^>]*>?/gm, '').trim(); 
                    const cleanBody = decodeHtmlEntities(textBody);

                    return {
                        id: page.id,
                        key: "WIKI", 
                        summary: page.title,
                        status: page.status,
                        priority: "Medium", 
                        updated: page.history?.lastUpdated?.when || page.version?.when,
                        // Deep link to comment in Confluence
                        url: `https://${host}/wiki${page._links.webui}?focusedCommentId=${lastComment.id}#comment-${lastComment.id}`,
                        source: 'confluence',
                        lastComment: {
                           author: lastComment.history?.createdBy?.displayName || "Unknown User",
                           body: cleanBody || "Content not available", 
                           created: lastComment.history?.createdDate,
                        }
                    };
                }) || [];
            items.push(...wikiItems);
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
