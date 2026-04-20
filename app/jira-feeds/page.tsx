"use client";

import { JiraFeedCard } from "@/components/dashboard/jira-feed-card";

export const dynamic = "force-dynamic";

export default function JiraFeedsPage() {
  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-linear-to-br from-blue-50/30 via-background to-indigo-50/20 dark:from-blue-950/15 dark:via-background dark:to-indigo-950/10">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-blue-400/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-indigo-400/8 blur-3xl" />

      {/* Header */}
      <div className="relative shrink-0 px-8 pt-8 pb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            Auto-syncs every 2 minutes
          </p>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Jira Feeds
          </h1>
        </div>
      </div>

      {/* Cards */}
      <div className="relative flex-1 min-h-0 overflow-auto px-8 pb-8">
        <div className="grid gap-6 md:grid-cols-2 h-full">
          <JiraFeedCard
            title="Needs Reply"
            description="Tickets where you were mentioned"
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
    </div>
  );
}
