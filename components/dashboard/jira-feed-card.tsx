"use client";

import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { UserAvatar } from "@/components/build-monitor/build-utils";

interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  status: string;
  priority: string;
  updated: string;
  url?: string;
  source?: "jira" | "confluence";
  assignee?: {
    displayName: string;
    avatarUrl?: string;
  };
  lastComment?: {
    author: string;
    body: string;
    created: string;
  };
  duedate?: string;
  daysUntilDue?: number;
}

interface JiraFeedCardProps {
  title: string;
  description: string;
  icon: string;
  apiEndpoint: string;
}

export function JiraFeedCard({
  title,
  description,
  icon,
  apiEndpoint,
}: JiraFeedCardProps) {
  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const Icon =
    icon === "needs-reply"
      ? MessageSquare
      : icon === "due-soon"
        ? Clock
        : AlertCircle;

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
          if (response.status === 401 || response.status === 404) {
            setIssues([]);
            return;
          }
          throw new Error("Failed to fetch");
        }
        const data = await response.json();
        setIssues(data.issues || []);
      } catch (err) {
        console.error(err);
        setError("Unable to sync");
      } finally {
        setIsLoading(false);
      }
    };

    fetchIssues();
    const interval = setInterval(fetchIssues, 120000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  return (
    <div className="flex flex-col rounded-2xl border border-white/40 dark:border-white/8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-2xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_60px_-12px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/50 dark:ring-white/5 overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-3 px-6 py-4 border-b border-white/20 dark:border-white/10">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/10 text-foreground">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
            {issues.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-pink-500 text-white text-[10px] font-bold px-1.5">
                {issues.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-xs text-muted-foreground mt-2">
              Syncing...
            </span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <AlertCircle className="h-6 w-6 mb-2 opacity-40" />
            <p className="text-sm">{error}</p>
          </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-3 text-emerald-500/30" />
            <p className="text-sm font-medium text-foreground">
              All caught up!
            </p>
            <p className="text-xs">No items requiring attention</p>
          </div>
        ) : (
          <div>
            {issues.map((issue, i) => (
              <a
                key={issue.id}
                href={issue.url || "#"}
                target="_blank"
                className={`block px-6 py-3.5 hover:bg-white/40 dark:hover:bg-white/5 transition-colors ${
                  i !== issues.length - 1
                    ? "border-b border-white/15 dark:border-white/5"
                    : ""
                }`}
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="mt-0.5 shrink-0">
                    {issue.assignee ? (
                      <UserAvatar
                        name={issue.assignee.displayName}
                        avatarUrl={issue.assignee.avatarUrl}
                        className="h-8 w-8 rounded-lg"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center border border-border/30">
                        <span className="text-[10px] font-bold text-muted-foreground">
                          {issue.key.substring(0, 1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <h4 className="text-[13px] font-medium text-foreground truncate">
                        {issue.summary}
                      </h4>
                      <span className="text-[10px] text-muted-foreground font-mono shrink-0 mt-0.5">
                        {new Date(issue.updated).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>

                    {/* Secondary info */}
                    {icon === "due-soon" ? (
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                            issue.priority === "Highest" ||
                            issue.priority === "High"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : issue.priority === "Medium"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {issue.priority}
                        </span>
                        {issue.daysUntilDue !== undefined && (
                          <span
                            className={`text-[10px] ${
                              issue.daysUntilDue <= 1
                                ? "text-red-500 font-medium"
                                : "text-muted-foreground"
                            }`}
                          >
                            {issue.daysUntilDue <= 0
                              ? "Overdue"
                              : `${issue.daysUntilDue}d left`}
                          </span>
                        )}
                      </div>
                    ) : (
                      issue.lastComment && (
                        <div className="flex items-center text-xs text-muted-foreground mt-1 pl-2 border-l-2 border-pink-500/20">
                          <span className="italic truncate">
                            &ldquo;{issue.lastComment.body}&rdquo;
                          </span>
                          <span className="shrink-0 not-italic text-[10px] ml-1.5 opacity-60">
                            &mdash; {issue.lastComment.author.split(" ")[0]}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
