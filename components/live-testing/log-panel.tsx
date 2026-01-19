"use client";

import { useState, useRef, useEffect } from "react";
import {
  Terminal,
  ChevronUp,
  ChevronDown,
  Trash2,
  Download,
  Search,
  Filter,
  Circle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type LogLevel = "info" | "debug" | "warn" | "error" | "verbose";

export interface LogEntry {
  id: string;
  timestamp: Date;
  level: LogLevel;
  tag: string;
  message: string;
}

interface LogPanelProps {
  logs?: LogEntry[];
  disabled?: boolean;
  onClear?: () => void;
}

const LOG_LEVEL_STYLES: Record<LogLevel, { color: string; bg: string }> = {
  verbose: { color: "text-slate-400", bg: "bg-slate-500/10" },
  debug: { color: "text-blue-400", bg: "bg-blue-500/10" },
  info: { color: "text-green-400", bg: "bg-green-500/10" },
  warn: { color: "text-amber-400", bg: "bg-amber-500/10" },
  error: { color: "text-red-400", bg: "bg-red-500/10" },
};

const SAMPLE_LOGS: LogEntry[] = [
  { id: "1", timestamp: new Date(), level: "info", tag: "AppInit", message: "Application starting..." },
  { id: "2", timestamp: new Date(), level: "debug", tag: "Network", message: "Connecting to API server" },
  { id: "3", timestamp: new Date(), level: "info", tag: "Auth", message: "User session restored" },
  { id: "4", timestamp: new Date(), level: "warn", tag: "Cache", message: "Cache miss for user preferences" },
  { id: "5", timestamp: new Date(), level: "error", tag: "Network", message: "Failed to fetch remote config" },
  { id: "6", timestamp: new Date(), level: "verbose", tag: "UI", message: "Rendering home screen" },
];

export function LogPanel({ logs = SAMPLE_LOGS, disabled = true, onClear }: LogPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLevel, setFilterLevel] = useState<LogLevel | "all">("all");
  const logsEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      searchQuery === "" ||
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.tag.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = filterLevel === "all" || log.level === filterLevel;
    return matchesSearch && matchesLevel;
  });

  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, isExpanded]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const handleClear = () => {
    if (onClear && !disabled) {
      onClear();
    }
  };

  const levelCounts = logs.reduce(
    (acc, log) => {
      acc[log.level] = (acc[log.level] || 0) + 1;
      return acc;
    },
    {} as Record<LogLevel, number>
  );

  return (
    <div className="border border-border/50 rounded-xl bg-card/30 backdrop-blur-sm overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <Terminal className="h-4 w-4 text-pink-500" />
          <span className="font-medium text-sm">Logcat</span>
          <div className="flex items-center gap-1.5">
            {levelCounts.error && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-red-500/30 text-red-400 bg-red-500/10">
                {levelCounts.error} errors
              </Badge>
            )}
            {levelCounts.warn && (
              <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-amber-500/30 text-amber-400 bg-amber-500/10">
                {levelCounts.warn} warnings
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            disabled={disabled}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
          >
            <Download className="h-3.5 w-3.5" />
          </Button>
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="flex flex-col">
          {/* Search and Filters */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border/30">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-background/50"
                disabled={disabled}
              />
            </div>
            <div className="flex items-center gap-1">
              {(["all", "error", "warn", "info", "debug", "verbose"] as const).map((level) => (
                <Button
                  key={level}
                  variant="ghost"
                  size="sm"
                  disabled={disabled}
                  onClick={() => setFilterLevel(level)}
                  className={cn(
                    "h-7 px-2 text-[10px] uppercase font-medium rounded",
                    filterLevel === level
                      ? "bg-pink-500/10 text-pink-500"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {level === "all" ? "All" : level.charAt(0)}
                </Button>
              ))}
            </div>
          </div>

          {/* Logs List */}
          <div className="h-48 overflow-auto font-mono text-xs">
            {disabled ? (
              <div className="h-full flex items-center justify-center text-muted-foreground/50">
                <p>Connect to emulator to view logs</p>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground/50">
                <p>No logs matching filters</p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredLogs.map((log) => {
                  const style = LOG_LEVEL_STYLES[log.level];
                  return (
                    <div
                      key={log.id}
                      className={cn(
                        "flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/30 transition-colors",
                        style.bg
                      )}
                    >
                      <span className="text-muted-foreground shrink-0 tabular-nums">
                        {formatTime(log.timestamp)}
                      </span>
                      <span className={cn("w-12 shrink-0 uppercase font-medium", style.color)}>
                        {log.level.slice(0, 5)}
                      </span>
                      <span className="text-pink-400 shrink-0 min-w-[60px]">{log.tag}</span>
                      <span className="text-foreground/80 break-all">{log.message}</span>
                    </div>
                  );
                })}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
