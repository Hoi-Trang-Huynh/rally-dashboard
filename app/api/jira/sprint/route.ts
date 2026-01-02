import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type"); // "delivery" or "operation"

  const host = process.env.JIRA_HOST;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;
  
  // Determine Board ID based on type
  let boardId = "";
  if (type === "delivery") {
    boardId = process.env.JIRA_DELIVERY_BOARD_ID || "";
  } else if (type === "operation") {
    boardId = process.env.JIRA_OPERATION_BOARD_ID || "";
  }

  if (!host || !email || !apiToken || !boardId) {
    return NextResponse.json({
      error: "Jira configuration missing. Check JIRA_HOST, JIRA_EMAIL, JIRA_API_TOKEN, and JIRA_BOARD_IDs in .env",
    }, { status: 500 });
  }

  const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
  };

  try {
    // 1. Get Active Sprint for Board
    const sprintRes = await fetch(
      `https://${host}/rest/agile/1.0/board/${boardId}/sprint?state=active`,
      { headers, cache: "no-store" }
    );
    
    if (!sprintRes.ok) {
      const errorBody = await sprintRes.text();
      console.error(`Jira Sprint API Failed (${sprintRes.status}):`, errorBody);
      return NextResponse.json({ 
        error: `Jira API error: ${sprintRes.status}`,
        details: errorBody
      }, { status: 500 });
    }
    
    const sprintData = await sprintRes.json();
    const activeSprint = sprintData.values?.[0];

    if (!activeSprint) {
      return NextResponse.json({ 
        name: "No Active Sprint", 
        progress: 0, 
        total: 0,
        completed: 0,
        daysLeft: 0,
        status: "No Active Sprint"
      });
    }

    // 2. Get Issues for Sprint to calculate progress
    const issuesRes = await fetch(
      `https://${host}/rest/agile/1.0/sprint/${activeSprint.id}/issue?maxResults=100&fields=status,resolution`,
      { headers, cache: "no-store" }
    );
    
    if (!issuesRes.ok) {
      console.error(`Jira Issues API Failed: ${issuesRes.status}`);
      return NextResponse.json({
        name: activeSprint.name,
        goal: activeSprint.goal || "",
        daysLeft: 0,
        progress: 0,
        total: 0,
        completed: 0,
        status: "Active (issues fetch failed)"
      });
    }
    
    const issuesData = await issuesRes.json();
    const issues = issuesData.issues || [];

    const totalIssues = issues.length;
    const completedIssues = issues.filter((i: any) => i.fields.status.statusCategory.key === "done").length;
    
    const progress = totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0;

    // Calculate Days Left
    const endDate = new Date(activeSprint.endDate);
    const today = new Date();
    const diffTime = Math.max(0, endDate.getTime() - today.getTime());
    const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    return NextResponse.json({
      name: activeSprint.name,
      goal: activeSprint.goal || "",
      daysLeft,
      progress,
      total: totalIssues,
      completed: completedIssues,
      status: "Active"
    });

  } catch (error) {
    console.error("Jira API Error:", error);
    return NextResponse.json({ error: "Failed to fetch sprint data" }, { status: 500 });
  }
}
