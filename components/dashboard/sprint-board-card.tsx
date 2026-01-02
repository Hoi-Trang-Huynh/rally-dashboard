"use client";

import { useEffect, useState } from "react";
import { Loader2, AlertCircle } from "lucide-react";

interface SprintData {
  name: string;
  goal: string;
  daysLeft: number;
  progress: number; // 0-100
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

export function SprintBoardCard({ title, type, gradientFrom, gradientTo }: SprintBoardCardProps) {
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
          error: "Check credentials"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [type]);

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 min-h-[200px] justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Syncing with Jira...</span>
      </div>
    );
  }

  const isError = data?.error;

  return (
    <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 transition-all hover:shadow-xl hover:-translate-y-1 group">
       <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
         {title}
         {isError && <AlertCircle className="h-4 w-4 text-red-500" />}
       </h3>
       
       <div className="text-3xl font-bold text-foreground truncate">
         {data?.name || "No Active Sprint"}
       </div>
       
       {/* Progress Bar */}
       <div className="w-full bg-muted rounded-full h-2.5 mt-2 overflow-hidden">
         <div 
            className={`h-2.5 rounded-full transition-all duration-1000 bg-gradient-to-r ${gradientFrom} ${gradientTo}`} 
            style={{ width: `${data?.progress || 0}%` }}
         />
       </div>
       
       <div className="flex justify-between items-center text-sm font-medium">
          <span className="text-muted-foreground">
             {data?.completed}/{data?.total} Issues
          </span>
          <span className={`${data && data.daysLeft <= 2 ? "text-red-500" : "text-muted-foreground"}`}>
             {isError ? "Configuration Required" : `${data?.daysLeft} days left`}
          </span>
       </div>
    </div>
  );
}
