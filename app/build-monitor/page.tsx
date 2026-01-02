"use client"

import { useState } from "react";
import { Activity, Github, Smartphone } from "lucide-react";
import { GithubBuildList } from "@/components/build-monitor/github-build-list";
import { CodemagicBuildList } from "@/components/build-monitor/codemagic-build-list";

// Disable static generation - this page uses dynamic API calls
export const dynamic = "force-dynamic";

export default function BuildMonitorPage() {
  const [activeTab, setActiveTab] = useState("mobile");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-6 pt-8 pb-6 gap-8 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                <Activity className="h-7 w-7" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Build Monitor</h1>
                <p className="text-lg text-muted-foreground">Real-time CI/CD pipeline status</p>
            </div>
        </div>

        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab("mobile")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "mobile" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
                <Smartphone className="h-4 w-4" />
                Mobile
            </button>
            <button 
                onClick={() => setActiveTab("backend")}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === "backend" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
                <Github className="h-4 w-4" />
                Backend
            </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
          {activeTab === "mobile" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <CodemagicBuildList />
              </div>
          )}
          
          {activeTab === "backend" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <GithubBuildList />
              </div>
          )}
      </div>
    </div>
  );
}
