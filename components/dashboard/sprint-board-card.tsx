"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Timer } from "lucide-react";

interface SprintData {
  name: string;
  goal: string;
  daysLeft: number;
  progress: number;
  total: number;
  completed: number;
  status: string;
  error?: string;
}

interface SprintBoardCardProps {
  title: string;
  type: "delivery" | "operation";
  gradientFrom: string;
  gradientTo: string;
}

export function SprintBoardCard({
  title,
  type,
  gradientFrom,
  gradientTo,
}: SprintBoardCardProps) {
  const [data, setData] = useState<SprintData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/jira/sprint?type=${type}`);
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setData(json);
      } catch {
        setData({
          name: "Error loading",
          goal: "",
          daysLeft: 0,
          progress: 0,
          total: 0,
          completed: 0,
          status: "Error",
          error: "Check credentials",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-card p-6 flex flex-col items-center justify-center min-h-[160px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground mt-2">
          Syncing with Jira...
        </span>
      </div>
    );
  }

  const isError = data?.error;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all hover:shadow-lg">
      {/* Decorative gradient blob */}
      <div
        className={`absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 blur-2xl`}
      />

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {title}
          </span>
          {isError ? (
            <AlertCircle className="h-4 w-4 text-red-500" />
          ) : (
            <div
              className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                data && data.daysLeft <= 2
                  ? "bg-red-500/10 text-red-500"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <Timer className="h-3 w-3" />
              {isError
                ? "Error"
                : `${data?.daysLeft}d left`}
            </div>
          )}
        </div>

        <p className="text-xl font-bold text-foreground truncate mb-4">
          {data?.name || "No Active Sprint"}
        </p>

        {/* Progress */}
        <div className="space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-1000 bg-gradient-to-r ${gradientFrom} ${gradientTo}`}
              style={{ width: `${data?.progress || 0}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>
              {data?.completed}/{data?.total} issues
            </span>
            <span className="font-semibold text-foreground">
              {data?.progress || 0}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
