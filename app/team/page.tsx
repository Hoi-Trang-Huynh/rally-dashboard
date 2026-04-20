"use client";

import { useEffect, useState } from "react";
import { OrgChart } from "@/components/team/org-chart";
import { Loader2, RefreshCw } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  avatarUrl?: string;
  managerId?: string | null;
}

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="relative flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-linear-to-br from-violet-50/30 via-background to-blue-50/20 dark:from-violet-950/15 dark:via-background dark:to-blue-950/10">
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-violet-400/8 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-blue-400/8 blur-3xl" />

      {/* Header */}
      <div className="relative shrink-0 px-8 pt-8 pb-6">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {users.length > 0
                ? `${users.filter((u) => u.jobTitle).length} members`
                : "Loading..."}
            </p>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Team
            </h1>
          </div>
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-white/50 dark:bg-white/5 backdrop-blur-sm px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/80 dark:hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>
      </div>

      {/* Org chart area */}
      <div className="relative flex-1 overflow-auto min-h-0 mx-6 mb-6 rounded-2xl border border-white/40 dark:border-white/8 bg-white/40 dark:bg-zinc-900/40 backdrop-blur-2xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_60px_-12px_rgba(0,0,0,0.4)] ring-1 ring-inset ring-white/50 dark:ring-white/5">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded-2xl" />

        {loading && users.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Loading team...
            </span>
          </div>
        ) : (
          <OrgChart users={users} />
        )}
      </div>
    </div>
  );
}
