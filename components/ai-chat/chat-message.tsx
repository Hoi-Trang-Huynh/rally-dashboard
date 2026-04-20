"use client";

import { Bot, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ChatMessage, ToolCallInfo } from "@/types/ai-chat";

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const serverLabels: Record<string, string> = {
  atlassian: "Atlassian",
  unknown: "Tool",
};

function ToolCallPill({ tool }: { tool: ToolCallInfo }) {
  const label = serverLabels[tool.server] || tool.server;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium border bg-muted/50">
      {tool.status === "calling" && (
        <Loader2 className="h-3 w-3 animate-spin text-pink-500" />
      )}
      {tool.status === "done" && (
        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
      )}
      {tool.status === "error" && (
        <AlertCircle className="h-3 w-3 text-red-500" />
      )}
      <span>
        {label}: {tool.name.replaceAll("_", " ")}
      </span>
    </span>
  );
}

interface ChatMessageBubbleProps {
  message: ChatMessage;
  userImage?: string;
}

export function ChatMessageBubble({ message, userImage }: ChatMessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} animate-in fade-in slide-in-from-bottom-1 duration-200`}
    >
      {/* Avatar */}
      {isUser ? (
        userImage ? (
          <img
            src={userImage}
            alt=""
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-pink-500 to-orange-500 text-white text-xs font-bold">
            U
          </div>
        )
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted border border-border text-muted-foreground">
          <Bot className="h-4 w-4" />
        </div>
      )}

      {/* Message body */}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-linear-to-br from-pink-500 to-orange-500 text-white"
            : "bg-muted/60 border border-border/50 text-foreground"
        }`}
      >
        {/* Tool call indicators */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {message.toolCalls.map((tool, i) => (
              <ToolCallPill key={`${tool.name}-${i}`} tool={tool} />
            ))}
          </div>
        )}

        {/* Text content */}
        {message.content ? (
          isUser ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none text-[13px] leading-relaxed [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 prose-headings:text-sm prose-headings:font-semibold prose-pre:text-xs prose-pre:bg-black/5 prose-pre:dark:bg-white/5 prose-code:text-xs prose-code:before:content-none prose-code:after:content-none prose-table:text-xs prose-th:px-3 prose-th:py-1.5 prose-th:bg-muted/50 prose-td:px-3 prose-td:py-1.5 prose-table:border prose-table:border-border/50 prose-th:border prose-th:border-border/50 prose-td:border prose-td:border-border/50 prose-table:rounded-lg overflow-x-auto">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )
        ) : message.isStreaming ? (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-pink-500 animate-bounce [animation-delay:0ms]" />
            <div className="h-2 w-2 rounded-full bg-pink-500 animate-bounce [animation-delay:150ms]" />
            <div className="h-2 w-2 rounded-full bg-pink-500 animate-bounce [animation-delay:300ms]" />
          </div>
        ) : null}

        {/* Timestamp */}
        {message.timestamp && !message.isStreaming && (
          <p
            className={`text-[10px] mt-1 ${
              isUser ? "text-white/60" : "text-muted-foreground/60"
            }`}
          >
            {formatTime(message.timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}
