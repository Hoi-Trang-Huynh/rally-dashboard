"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { iconMap } from "@/config/navigation";

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
}

interface JiraFeedCardProps {
  title: string;
  description: string;
  icon: string;
  apiEndpoint: string;
}

const priorityColors: Record<string, string> = {
  High: "bg-red-500/20 text-red-600 dark:text-red-400",
  Highest: "bg-red-500/20 text-red-600 dark:text-red-400",
  Medium: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
  Low: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
};

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
  const IconColor = icon === "needs-reply" ? "text-blue-600 dark:text-blue-400" : (icon === "due-soon" ? "text-orange-600 dark:text-orange-400" : "text-red-600 dark:text-red-400");
  const IconBg = icon === "needs-reply" ? "bg-blue-500/20" : (icon === "due-soon" ? "bg-orange-500/20" : "bg-red-500/20");

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
    <Card className="h-full border-border shadow-sm bg-card overflow-hidden flex flex-col">
      <CardHeader className="pb-4 pt-6 px-6 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-4">
          <div className={`flex h-12 w-12 items-center justify-center rounded-xl border border-border shadow-sm ${IconBg} ${IconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold text-foreground">{title}</CardTitle>
            <p className="text-base text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 flex-1 relative min-h-[200px]">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500" />
          </div>
        ) : error ? (
           <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
             <AlertCircle className="h-8 w-8 mb-2 opacity-50" />
             <p>{error}</p>
           </div>
        ) : issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mb-3 text-emerald-500/30" />
            <p className="font-medium text-foreground">All caught up!</p>
            <p className="text-sm">No items requiring attention</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {issues.slice(0, 5).map((issue) => (
              <a 
                key={issue.id} 
                href={issue.url || "#"} 
                target="_blank" 
                className="block p-4 hover:bg-muted/50 transition-colors group relative"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">{issue.key === 'WIKI' ? 'PAGE' : issue.key}</span>
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 border-none ${priorityColors[issue.priority] || "bg-muted text-muted-foreground"}`}>
                        {issue.priority}
                      </Badge>
                    </div>
                    <div className="block">
                      <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-pink-500 transition-colors">
                        {issue.summary}
                      </h4>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-xs text-muted-foreground block">{new Date(issue.updated).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {issue.lastComment && (
                    <div className="mt-2 ml-2 pl-3 border-l-2 border-border text-xs text-muted-foreground italic">
                        "{issue.lastComment.body.substring(0, 60)}..."
                        <span className="block mt-0.5 text-[10px] text-muted-foreground/70 not-italic">- {issue.lastComment.author}</span>
                    </div>
                )}
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
