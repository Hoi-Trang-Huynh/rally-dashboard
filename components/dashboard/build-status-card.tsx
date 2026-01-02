"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { iconMap } from "@/config/navigation";

interface BuildStatus {
  status: "success" | "failure" | "building" | "unknown";
  message: string;
  branch?: string;
  commit?: string;
  timestamp?: string;
  url?: string;
}

interface BuildStatusCardProps {
  title: string;
  description: string;
  iconName: string;
  apiEndpoint: string;
}

const statusConfig = {
  success: {
    icon: CheckCircle2,
    variant: "default" as const,
    className: "bg-emerald-500/20 text-emerald-400 border-none px-3 py-1", 
    label: "Success",
  },
  failure: {
    icon: XCircle,
    variant: "destructive" as const,
    className: "bg-red-500/20 text-red-400 border-none px-3 py-1",
    label: "Failed",
  },
  building: {
    icon: RefreshCw,
    variant: "secondary" as const,
    className: "bg-amber-500/20 text-amber-400 border-none px-3 py-1 animate-pulse",
    label: "Building",
  },
  unknown: {
    icon: Clock,
    variant: "outline" as const,
    className: "bg-muted text-muted-foreground border-none px-3 py-1",
    label: "Unknown",
  },
};

export function BuildStatusCard({
  title,
  description,
  iconName,
  apiEndpoint,
}: BuildStatusCardProps) {
  const [buildStatus, setBuildStatus] = useState<BuildStatus>({
    status: "unknown",
    message: "Loading status...",
  });
  const [isLoading, setIsLoading] = useState(true);

  const Icon = iconMap[iconName] || Clock;

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(apiEndpoint);
        if (!response.ok) {
          throw new Error("Failed to fetch");
        }
        const data = await response.json();
        setBuildStatus(data);
      } catch {
        setBuildStatus({
          status: "unknown",
          message: "Unable to sync status.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [apiEndpoint]);

  const config = statusConfig[buildStatus.status];
  const StatusIcon = config.icon;

  return (
    <Card className="h-full border-border shadow-sm bg-card overflow-hidden">
      <CardHeader className="pb-4 pt-6 px-6 bg-muted/50 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card border border-border text-muted-foreground shadow-sm">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-foreground">{title}</CardTitle>
              <p className="text-base text-muted-foreground">{description}</p>
            </div>
          </div>
          <Badge className={`text-base font-medium rounded-full ${config.className}`}>
            <StatusIcon
              className={`h-4 w-4 mr-2 ${
                buildStatus.status === "building" ? "animate-spin" : ""
              }`}
            />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-3">
          <p className="text-base text-muted-foreground font-medium">{buildStatus.message}</p>
          
          {(buildStatus.branch || buildStatus.timestamp) && (
             <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                {buildStatus.branch && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border">
                        <span className="font-semibold text-foreground">Branch:</span>
                        <code>{buildStatus.branch}</code>
                    </div>
                )}
                {buildStatus.timestamp && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md border border-border">
                         <span>{new Date(buildStatus.timestamp).toLocaleString()}</span>
                    </div>
                )}
             </div>
          )}
          
          {buildStatus.url && (
            <div className="pt-2">
                <a
                href={buildStatus.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-semibold text-pink-500 hover:text-pink-400 hover:underline"
                >
                View Build Details →
                </a>
            </div>
          )}
        </div>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-card/80 backdrop-blur-sm z-10 p-0 m-0 rounded-none">
            <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
