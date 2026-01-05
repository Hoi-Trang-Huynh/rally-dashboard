"use client";

import { useState } from "react";
import { LayoutDashboard, Code, Users } from "lucide-react";
import { SprintBoardCard } from "@/components/dashboard/sprint-board-card";
import { ReleasesCard } from "@/components/dashboard/releases-card";
import { KudosFeedCard } from "@/components/dashboard/kudos-feed-card";
import { BountyBoardCard } from "@/components/dashboard/bounty-board-card";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning! ☀️";
  if (hour < 17) return "Good afternoon! 🌤️";
  if (hour < 21) return "Good evening! 🌅";
  return "Good night! 🌙";
}

export default function Home() {
  const greeting = getGreeting();
  const [activeTab, setActiveTab] = useState("development");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] px-6 pt-8 pb-6 gap-8 overflow-hidden">
      <div className="flex items-center justify-between shrink-0 border-b border-border/50 pb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/30">
            <LayoutDashboard className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">Overview</h1>
            <p className="text-lg text-muted-foreground">{greeting} Welcome to Mission Control</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setActiveTab("development")}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
              activeTab === "development" 
                ? "border-pink-500/50 bg-background shadow-md shadow-pink-500/10 ring-1 ring-pink-500/20 text-foreground" 
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-background hover:border-pink-500/50 hover:shadow-md hover:shadow-pink-500/5 hover:text-foreground"
            }`}
          >
            <Code className={`h-4 w-4 transition-colors ${
              activeTab === "development" ? "text-pink-500" : "group-hover:text-pink-500"
            }`} />
            <span>Development</span>
          </button>
          <button 
            onClick={() => setActiveTab("people")}
            className={`group relative flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all duration-300 ${
              activeTab === "people" 
                ? "border-pink-500/50 bg-background shadow-md shadow-pink-500/10 ring-1 ring-pink-500/20 text-foreground" 
                : "border-border/50 bg-muted/30 text-muted-foreground hover:bg-background hover:border-pink-500/50 hover:shadow-md hover:shadow-pink-500/5 hover:text-foreground"
            }`}
          >
            <Users className={`h-4 w-4 transition-colors ${
              activeTab === "people" ? "text-pink-500" : "group-hover:text-pink-500"
            }`} />
            <span>People</span>
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === "development" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid auto-rows-min gap-8 md:grid-cols-3">
              {/* System Status Card */}
              <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 transition-all hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">System Status</h3>
                </div>
                
                <div className="text-3xl font-bold text-foreground">
                  Operational
                </div>
                <p className="text-base text-muted-foreground">All systems functioning normally.</p>
              </div>
              
              {/* Dynamic Delivery Board */}
              <SprintBoardCard 
                title="Delivery Board"
                type="delivery"
                gradientFrom="from-pink-500"
                gradientTo="to-orange-500"
              />
              
              {/* Dynamic Operation Board */}
              <SprintBoardCard 
                title="Operation Board"
                type="operation"
                gradientFrom="from-blue-500"
                gradientTo="to-indigo-500"
              />
              
              {/* Releases Section - spans full width */}
              <ReleasesCard />
            </div>
          </div>
        )}

        {activeTab === "people" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid auto-rows-min gap-8 md:grid-cols-2">
              {/* Kudos Feed - Teammate appreciation */}
              <KudosFeedCard />
              
              {/* Bounty Board - Social rewards */}
              <BountyBoardCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
