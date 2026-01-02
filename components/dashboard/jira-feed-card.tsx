"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
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
  source?: 'jira' | 'confluence';
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

  const Icon = icon === "needs-reply" ? MessageSquare : (icon === "due-soon" ? Clock : AlertCircle);

  useEffect(() => {
    const fetchIssues = async () => {
      try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
           if(response.status === 401 || response.status === 404) {
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
    <Card className="h-full border-border shadow-sm bg-card overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-4 pt-6 px-6 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/50 shadow-sm bg-muted text-foreground">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold text-foreground">{title}</CardTitle>
              {issues.length > 0 && (
                <span className="bg-foreground text-background text-xs font-bold px-2 py-0.5 rounded-full">
                  {issues.length}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 relative min-h-[200px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-foreground" />
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
             <AlertCircle className="h-6 w-6 mb-2 opacity-50" />
             <p className="text-sm">{error}</p>
           </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-3 text-emerald-500/30" />
            <p className="font-medium text-foreground text-sm">All caught up!</p>
            <p className="text-xs">No items requiring attention</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[400px] overflow-y-auto">
            {issues.map((issue) => (
              <a 
                key={issue.id} 
                href={issue.url || "#"} 
                target="_blank" 
                className="block p-4 hover:bg-muted/40 transition-colors group relative"
              >
                <div className="flex gap-3">
                    {/* Status/Priority Indicator (Dot) */}
                    <div className="mt-1.5">
                         {issue.assignee ? (
                            <UserAvatar 
                                name={issue.assignee.displayName} 
                                avatarUrl={issue.assignee.avatarUrl} 
                                className="h-8 w-8 rounded-lg"
                            />
                         ) : (
                             <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center border border-border">
                                 <span className="text-[10px] font-bold text-muted-foreground">{issue.key.substring(0, 1)}</span>
                             </div>
                         )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2 mb-1">
                            <h4 className="text-sm font-medium text-foreground truncate transition-colors">
                                {issue.summary}
                            </h4>
                            <div className="text-right shrink-0 flex items-center gap-1.5">
                                {issue.source === 'confluence' ? (
                                    <svg className="w-4 h-4" viewBox="0 0 256 246" fill="none"><title>Confluence</title><path d="M9.26 187.76c-3.76 6.22-8.05 13.63-10.75 18.21a6.77 6.77 0 002.38 9.26l49.44 30.28a6.77 6.77 0 009.39-2.15c2.34-3.85 5.56-9.22 9.32-15.4 23.41-38.61 46.67-34 88.75-13.43l50.19 24.57a6.77 6.77 0 009.08-3.08l23.97-49.09a6.77 6.77 0 00-3.08-9.08c-17.04-8.34-50.92-24.93-73.22-35.86-65.93-32.29-122.79-30.47-155.48 45.77z" fill="#2684FF"/><path d="M246.11 57.03c3.76-6.22 8.05-13.63 10.75-18.21a6.77 6.77 0 00-2.38-9.26L205.04-.72a6.77 6.77 0 00-9.39 2.15c-2.34 3.85-5.56 9.22-9.32 15.4-23.41 38.61-46.67 34-88.75 13.43L47.39 5.69a6.77 6.77 0 00-9.08 3.08L14.34 57.86a6.77 6.77 0 003.08 9.08c17.04 8.34 50.92 24.93 73.22 35.86 65.93 32.29 122.79 30.47 155.47-45.77z" fill="#2684FF"/></svg>
                                ) : (
                                    <svg className="w-4 h-4 text-[#0052CC]" viewBox="0 0 24 24" fill="currentColor"><title>Jira</title><path d="M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.53a1.015 1.015 0 0 0-1.005-1.017zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.213 5.213h2.13v2.06a5.218 5.218 0 0 0 5.215 5.214V6.772a1.015 1.015 0 0 0-1-1.015zM23 0H11.442a5.215 5.215 0 0 0 5.214 5.214h2.129v2.06A5.215 5.215 0 0 0 24 12.487V1.015A1.015 1.015 0 0 0 23 0z"/></svg>
                                )}
                                <span className="text-[10px] text-muted-foreground font-mono">
                                    {new Date(issue.updated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </div>

                        {/* For due-soon: show priority; for needs-reply: show comment */}
                        {icon === 'due-soon' ? (
                            <div className="flex items-center gap-2 mt-1.5 text-xs">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                    issue.priority === 'Highest' || issue.priority === 'High' 
                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                        : issue.priority === 'Medium'
                                        ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                                }`}>
                                    {issue.priority}
                                </span>
                            </div>
                        ) : issue.lastComment && (
                            <div className="flex items-center text-xs text-muted-foreground mt-1.5 pl-2 border-l-2 border-border/60">
                                <span className="italic truncate">"{issue.lastComment.body}"</span>
                                <span className="shrink-0 not-italic text-[10px] ml-1.5 opacity-70">— {issue.lastComment.author.split(' ')[0]}</span>
                            </div>
                        )}
                    </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
