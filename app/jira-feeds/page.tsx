"use client";

import { JiraFeedCard } from "@/components/dashboard/jira-feed-card";
import { CheckSquare } from "lucide-react";

// Disable static generation - this page uses dynamic API calls
export const dynamic = "force-dynamic";

export default function JiraFeedsPage() {
  return (
    <div className="flex flex-col gap-8 py-8 px-6">
      <div className="flex items-center gap-4 border-b border-border/50 pb-6">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/20">
            <CheckSquare className="h-7 w-7" />
        </div>
        <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Jira Feeds</h1>
            <p className="text-lg text-muted-foreground">Track your tickets and blockers</p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <JiraFeedCard
          title="Needs Reply"
          description="Tickets where you were mentioned but haven't replied"
          icon="needs-reply"
          apiEndpoint="/api/jira/needs-reply"
        />
        <JiraFeedCard
          title="Due Soon"
          description="Tickets due in the next 7 days"
          icon="due-soon"
          apiEndpoint="/api/jira/blockers"
        />
      </div>
    </div>
  );
}
