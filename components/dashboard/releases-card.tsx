"use client";

import { useEffect, useState } from "react";
import { Loader2, Package, CheckCircle2, Clock, Calendar, ExternalLink, Filter } from "lucide-react";

interface Release {
  id: string;
  name: string;
  description: string;
  status: "Released" | "In Progress" | "Planned" | "Archived";
  released: boolean;
  releaseDate?: string;
  startDate?: string;
  overdue: boolean;
  url: string;
}

interface ReleasesData {
  releases: Release[];
  error?: string;
}

type StatusFilter = "All" | "Released" | "In Progress" | "Planned";

export function ReleasesCard() {
  const [data, setData] = useState<ReleasesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/jira/releases");
        if (!res.ok) throw new Error("Failed to load");
        const json = await res.json();
        setData(json);
      } catch {
        setData({ releases: [], error: "Failed to load releases" });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 min-h-[200px] justify-center items-center col-span-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="text-muted-foreground text-sm">Loading releases...</span>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Released":
        return <CheckCircle2 className="h-4 w-4" />;
      case "In Progress":
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Released":
        return "bg-emerald-500/20 text-emerald-400";
      case "In Progress":
        return "bg-blue-500/20 text-blue-400";
      case "Archived":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-amber-500/20 text-amber-400";
    }
  };

  const getFilterButtonStyles = (filter: StatusFilter) => {
    const isActive = statusFilter === filter;
    if (isActive) {
      switch (filter) {
        case "Released":
          return "bg-emerald-500/20 text-emerald-400 border-emerald-500/50";
        case "In Progress":
          return "bg-blue-500/20 text-blue-400 border-blue-500/50";
        case "Planned":
          return "bg-amber-500/20 text-amber-400 border-amber-500/50";
        default:
          return "bg-pink-500/20 text-pink-400 border-pink-500/50";
      }
    }
    return "bg-muted/50 text-muted-foreground border-border hover:bg-muted";
  };

  const formatDate = (date?: string) => {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  // Filter releases by status
  const filteredReleases = data?.releases.filter(release => {
    if (statusFilter === "All") return true;
    return release.status === statusFilter;
  }) || [];

  const statusCounts = {
    All: data?.releases.length || 0,
    Released: data?.releases.filter(r => r.status === "Released").length || 0,
    "In Progress": data?.releases.filter(r => r.status === "In Progress").length || 0,
    Planned: data?.releases.filter(r => r.status === "Planned").length || 0,
  };

  return (
    <div className="p-6 rounded-2xl bg-card border border-border shadow-sm flex flex-col gap-4 col-span-full transition-all hover:shadow-xl" style={{ maxHeight: 'calc(100vh - 500px)', minHeight: '200px' }}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <Package className="h-5 w-5" />
          Release Roadmap
        </h3>
        
        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {(["All", "Released", "In Progress", "Planned"] as StatusFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${getFilterButtonStyles(filter)}`}
            >
              {filter} ({statusCounts[filter]})
            </button>
          ))}
        </div>
      </div>

      {data?.error ? (
        <p className="text-red-500 text-sm">{data.error}</p>
      ) : filteredReleases.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">No releases found for this filter</p>
      ) : (
        <div className="overflow-auto flex-1 -mx-6 px-6">
          <table className="w-full min-w-[600px]">
            <thead className="sticky top-0 bg-card z-10">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Version</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Start Date</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Release Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredReleases.map((release) => (
                <tr key={release.id} className="border-b border-border/50 hover:bg-muted/50 transition-colors group">
                  <td className="py-3 px-4">
                    <a
                      href={release.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 font-semibold text-foreground hover:text-pink-500 transition-colors"
                    >
                      {release.name}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                    {release.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">{release.description}</p>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles(release.status)}`}>
                      {getStatusIcon(release.status)}
                      {release.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatDate(release.startDate)}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm ${release.overdue ? "text-red-500 font-medium" : "text-muted-foreground"}`}>
                      {formatDate(release.releaseDate)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
