"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  Send,
  Bot,
  Sparkles,
  Plus,
  MessageSquare,
  Trash2,
} from "lucide-react";
import { ChatMessageBubble } from "./chat-message";
import type {
  ChatMessage,
  ChatSession,
  ToolCallInfo,
  StreamEvent,
  ServerState,
} from "@/types/ai-chat";

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

const SUGGESTIONS = [
  "What tickets are in the current sprint?",
  "Summarize open blockers in Jira",
  "Find the onboarding flow documentation in Confluence",
  "What's the status of the current sprint?",
];

const DEFAULT_SERVERS: ServerState[] = [
  { name: "atlassian", status: "inactive" },
];

function updateLastAssistant(
  prev: ChatMessage[],
  updater: (msg: ChatMessage) => ChatMessage,
): ChatMessage[] {
  const updated = [...prev];
  const last = updated[updated.length - 1];
  if (last?.role === "assistant") {
    updated[updated.length - 1] = updater(last);
  }
  return updated;
}

function handleStreamEvent(
  event: StreamEvent,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setServers: React.Dispatch<React.SetStateAction<ServerState[]>>,
) {
  switch (event.type) {
    case "servers":
      setServers((prev) =>
        prev.map((s) => ({
          ...s,
          status: (event.servers || []).includes(s.name) ? "live" : s.status,
        })),
      );
      break;

    case "text_delta":
      setMessages((prev) =>
        updateLastAssistant(prev, (msg) => ({
          ...msg,
          content: msg.content + (event.content || ""),
        })),
      );
      break;

    case "tool_call": {
      const toolCall: ToolCallInfo = {
        name: event.name || "",
        server: event.server || "unknown",
        status: "calling",
      };
      setMessages((prev) =>
        updateLastAssistant(prev, (msg) => ({
          ...msg,
          toolCalls: [...(msg.toolCalls || []), toolCall],
        })),
      );
      break;
    }

    case "tool_result":
      setMessages((prev) =>
        updateLastAssistant(prev, (msg) => ({
          ...msg,
          toolCalls: msg.toolCalls?.map((tc) =>
            tc.name === event.name && tc.status === "calling"
              ? { ...tc, status: "done" as const }
              : tc,
          ),
        })),
      );
      break;

    case "tool_error":
      setMessages((prev) =>
        updateLastAssistant(prev, (msg) => ({
          ...msg,
          toolCalls: msg.toolCalls?.map((tc) =>
            tc.name === event.name && tc.status === "calling"
              ? { ...tc, status: "error" as const, error: event.error }
              : tc,
          ),
        })),
      );
      break;

    case "error":
      setMessages((prev) =>
        updateLastAssistant(prev, (msg) => ({
          ...msg,
          content:
            msg.content +
            `\n\n**Error:** ${event.error || "Something went wrong"}`,
          isStreaming: false,
        })),
      );
      break;

    case "done":
      setMessages((prev) =>
        updateLastAssistant(prev, (msg) => ({ ...msg, isStreaming: false })),
      );
      break;
  }
}

// --- Server status indicator components ---

const SERVER_ICONS: Record<string, React.ReactNode> = {
  atlassian: (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor">
      <path d="M6.81 9.77c-.3-.3-.79-.27-1.06.07a.75.75 0 0 0-.05.85l4.73 8.19a.75.75 0 0 0 1.3 0l2.45-4.24c.5-.87.47-1.93-.07-2.78L10.7 6.6a.33.33 0 0 0-.57 0L6.81 9.77zm4.87-7.9a.75.75 0 0 0-1.3 0L5.6 11.1a.33.33 0 0 0 .28.5h9.64a.33.33 0 0 0 .28-.5l-4.12-7.13z" />
      <path d="M17.19 9.77c.3-.3.79-.27 1.06.07.22.26.24.63.05.85l-4.73 8.19a.75.75 0 0 1-1.3 0l-2.45-4.24c-.5-.87-.47-1.93.07-2.78l3.41-5.26a.33.33 0 0 1 .57 0l3.32 3.17z" />
    </svg>
  ),
};

const STATUS_STYLES: Record<
  ServerState["status"],
  { dot: string; text: string; bg: string; border: string }
> = {
  inactive: {
    dot: "bg-red-500",
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
  },
  connecting: {
    dot: "bg-amber-500 animate-pulse",
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  live: {
    dot: "bg-emerald-500",
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
};

function ServerStatusBadge({ server }: { server: ServerState }) {
  const style = STATUS_STYLES[server.status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${style.bg} ${style.border} ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {SERVER_ICONS[server.name] || null}
      {server.name.charAt(0).toUpperCase() + server.name.slice(1)}
    </span>
  );
}

function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// --- Main component ---

export function ChatInterface() {
  const { data: session } = useSession();
  const userImage = session?.user?.image || undefined;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState<"sonnet" | "opus">("sonnet");
  const [servers, setServers] = useState<ServerState[]>(DEFAULT_SERVERS);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pastSessions, setPastSessions] = useState<ChatSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);

  // Load past sessions on mount
  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/ai-chat/sessions");
      if (res.ok) {
        const data = await res.json();
        setPastSessions(data);
      }
    } catch {}
  };

  // Auto-save session after streaming completes
  useEffect(() => {
    const hasContent = messages.some((m) => m.content && !m.isStreaming);
    const isStreaming = messages.some((m) => m.isStreaming);
    if (!hasContent || isStreaming || messages.length === 0) return;

    const timeout = setTimeout(() => saveSession(), 1000);
    return () => clearTimeout(timeout);
  }, [messages]);

  const saveSession = async () => {
    if (messages.length === 0) return;

    // Generate title from first user message
    const firstUserMsg = messages.find((m) => m.role === "user");
    const title = firstUserMsg
      ? firstUserMsg.content.slice(0, 60) + (firstUserMsg.content.length > 60 ? "..." : "")
      : "New Chat";

    try {
      if (sessionId) {
        // Update existing session
        await fetch(`/api/ai-chat/sessions/${sessionId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, title, model }),
        });
      } else {
        // Create new session
        const res = await fetch("/api/ai-chat/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages, title, model }),
        });
        if (res.ok) {
          const data = await res.json();
          setSessionId(data._id);
        }
      }
      fetchSessions();
    } catch {}
  };

  const loadSession = async (id: string) => {
    try {
      const res = await fetch(`/api/ai-chat/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setModel(data.model || "sonnet");
        setSessionId(data._id);
        setShowSessions(false);
      }
    } catch {}
  };

  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/ai-chat/sessions/${id}`, { method: "DELETE" });
      setPastSessions((prev) => prev.filter((s) => s._id !== id));
      if (sessionId === id) {
        newChat();
      }
    } catch {}
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    setServers(DEFAULT_SERVERS.map((s) => ({ ...s })));
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  const sendMessage = useCallback(
    async (text?: string) => {
      const content = (text || input).trim();
      if (!content || isLoading) return;

      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";

      const now = new Date().toISOString();
      const userMsg: ChatMessage = {
        id: genId(),
        role: "user",
        content,
        timestamp: now,
      };
      const assistantMsg: ChatMessage = {
        id: genId(),
        role: "assistant",
        content: "",
        timestamp: now,
        toolCalls: [],
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      setServers((prev) =>
        prev.map((s) =>
          s.status === "inactive" ? { ...s, status: "connecting" } : s,
        ),
      );

      try {
        const history = [...messages, userMsg].map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const response = await fetch("/api/ai-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, model }),
        });

        if (!response.ok) {
          throw new Error(
            `Server error: ${response.status} ${response.statusText}`,
          );
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const event: StreamEvent = JSON.parse(line);
              handleStreamEvent(event, setMessages, setServers);
            } catch {
              continue;
            }
          }
        }

        // Update assistant timestamp to completion time
        setMessages((prev) =>
          updateLastAssistant(prev, (msg) => ({
            ...msg,
            timestamp: new Date().toISOString(),
          })),
        );
      } catch (error: unknown) {
        const errMsg =
          error instanceof Error ? error.message : "Unknown error";
        setMessages((prev) =>
          updateLastAssistant(prev, (msg) => ({
            ...msg,
            content: `**Error:** ${errMsg}`,
            isStreaming: false,
          })),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, model],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="relative z-10 flex h-full flex-col mx-auto w-full px-6 py-6">
      {/* Glassy chat container */}
      <div className="flex flex-col flex-1 min-h-0 rounded-3xl border border-white/40 dark:border-white/8 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-3xl shadow-[0_8px_60px_-12px_rgba(0,0,0,0.12),0_2px_12px_-4px_rgba(0,0,0,0.06)] dark:shadow-[0_8px_60px_-12px_rgba(0,0,0,0.5),0_2px_12px_-4px_rgba(0,0,0,0.3)] ring-1 ring-inset ring-white/50 dark:ring-white/6">
        {/* Fixed header */}
        <div className="shrink-0 flex items-center justify-between gap-4 px-6 py-4 border-b border-white/20 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                Rally AI
              </h1>
              <p className="text-xs text-muted-foreground">
                Ask about designs, tickets, or docs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Session history toggle */}
            <button
              onClick={() => setShowSessions(!showSessions)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${
                showSessions
                  ? "bg-pink-500/10 text-pink-500"
                  : "hover:bg-black/5 dark:hover:bg-white/10 text-muted-foreground"
              }`}
              title="Chat history"
            >
              <MessageSquare className="h-4 w-4" />
            </button>

            {/* New chat */}
            <button
              onClick={newChat}
              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="New chat"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Model picker */}
            <div className="flex items-center rounded-lg border border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5 p-0.5">
              <button
                onClick={() => setModel("sonnet")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  model === "sonnet"
                    ? "bg-white dark:bg-white/15 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Sonnet
              </button>
              <button
                onClick={() => setModel("opus")}
                className={`rounded-md px-3 py-1 text-xs font-medium transition-all ${
                  model === "opus"
                    ? "bg-white dark:bg-white/15 text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Opus
              </button>
            </div>
          </div>
        </div>

        {/* Content area — either session list or messages */}
        {showSessions ? (
          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                Chat History
              </h2>
              <span className="text-xs text-muted-foreground">
                {pastSessions.length} session{pastSessions.length !== 1 ? "s" : ""}
              </span>
            </div>
            {pastSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No past sessions yet
              </p>
            ) : (
              <div className="flex flex-col gap-1.5">
                {pastSessions.map((s) => (
                  <button
                    key={s._id}
                    onClick={() => loadSession(s._id!)}
                    className={`group flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                      sessionId === s._id
                        ? "bg-pink-500/10 border border-pink-500/20"
                        : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <img
                      src={s.createdBy.image || undefined}
                      alt=""
                      className="h-7 w-7 shrink-0 rounded-full object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {s.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {s.createdBy.name} &middot;{" "}
                        {formatSessionDate(s.updatedAt)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteSession(s._id!, e)}
                      className="opacity-0 group-hover:opacity-100 flex h-6 w-6 items-center justify-center rounded-md hover:bg-red-500/10 transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </button>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Scrollable messages */}
            <div
              ref={scrollRef}
              className="flex-1 min-h-0 overflow-y-auto px-6 py-4 font-(family-name:--font-jetbrains)"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-linear-to-br from-pink-500 to-orange-500 text-white shadow-lg shadow-pink-200 dark:shadow-pink-900/30">
                    <Bot className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      How can I help?
                    </h2>
                    <p className="text-muted-foreground mt-1 max-w-md">
                      Ask me about Jira tickets, Confluence docs, or anything
                      about the project.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg w-full">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        className="rounded-xl border border-white/30 dark:border-white/10 bg-white/40 dark:bg-white/5 px-4 py-3 text-left text-sm text-muted-foreground hover:bg-white/70 dark:hover:bg-white/10 hover:text-foreground transition-colors backdrop-blur-sm"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {messages.map((msg) => (
                    <ChatMessageBubble
                      key={msg.id}
                      message={msg}
                      userImage={userImage}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Fixed input + server status footer */}
            <div className="shrink-0 border-t border-white/20 dark:border-white/10 px-6 py-4">
              <div className="flex items-end gap-3">
                <div className="relative flex-1">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Rally AI anything..."
                    rows={1}
                    disabled={isLoading}
                    className="w-full resize-none rounded-xl border border-black/10 dark:border-white/10 bg-white/70 dark:bg-white/5 px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-pink-500/30 focus:border-pink-500/50 disabled:opacity-50 transition-all shadow-sm"
                  />
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1.5 flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-pink-500 to-orange-400 text-white shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/30 hover:brightness-110 disabled:opacity-30 disabled:shadow-none transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {/* Server status bar */}
              <div className="flex items-center justify-center gap-3 mt-3">
                {servers.map((s) => (
                  <ServerStatusBadge key={s.name} server={s} />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
