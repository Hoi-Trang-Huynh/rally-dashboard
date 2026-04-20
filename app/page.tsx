"use client";

import { useState } from "react";
import { Code, Users, Zap } from "lucide-react";
import { SprintBoardCard } from "@/components/dashboard/sprint-board-card";
import { ReleasesCard } from "@/components/dashboard/releases-card";
import { KudosFeedCard } from "@/components/dashboard/kudos-feed-card";
import { BountyBoardCard } from "@/components/dashboard/bounty-board-card";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "Good morning", emoji: "☀️" };
  if (hour < 17) return { text: "Good afternoon", emoji: "🌤️" };
  if (hour < 21) return { text: "Good evening", emoji: "🌅" };
  return { text: "Good night", emoji: "🌙" };
}

const tabs = [
  { id: "development", label: "Development", icon: Code },
  { id: "people", label: "People", icon: Users },
] as const;

export default function Home() {
  const { text, emoji } = getGreeting();
  const [activeTab, setActiveTab] = useState<string>("development");

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden">
      {/* Header */}
      <div className="shrink-0 px-8 pt-8 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {text} {emoji}
            </p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Mission Control
            </h1>
          </div>

          {/* Tab pills */}
          <div className="flex items-center rounded-xl border border-border/50 bg-muted/30 p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${isActive ? "text-pink-500" : ""}`}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto px-8 pb-8">
        {activeTab === "development" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-6">
            {/* Top row: Status + Sprint */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* System Status */}
              <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 transition-all hover:shadow-lg">
                <div className="absolute top-0 right-0 h-32 w-32 translate-x-8 -translate-y-8 rounded-full bg-emerald-500/10 blur-2xl" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
                      All Systems Operational
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Zap className="h-6 w-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-foreground">
                        Healthy
                      </p>
                      <p className="text-sm text-muted-foreground">
                        All services running normally
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Sprint */}
              <SprintBoardCard
                title="Delivery Sprint"
                type="delivery"
                gradientFrom="from-pink-500"
                gradientTo="to-orange-500"
              />
            </div>

            {/* Releases — full width */}
            <ReleasesCard />
          </div>
        )}

        {activeTab === "people" && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid gap-6 md:grid-cols-2">
              <KudosFeedCard />
              <BountyBoardCard />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
