export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string; // ISO string
  toolCalls?: ToolCallInfo[];
  isStreaming?: boolean;
}

export interface ToolCallInfo {
  name: string;
  server: string;
  status: "calling" | "done" | "error";
  error?: string;
}

export type ServerStatus = "inactive" | "connecting" | "live";

export interface ServerState {
  name: string;
  status: ServerStatus;
}

export interface ChatSession {
  _id?: string;
  title: string;
  messages: ChatMessage[];
  createdBy: {
    name: string;
    email: string;
    image?: string;
  };
  model?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StreamEvent {
  type:
    | "servers"
    | "text_delta"
    | "tool_call"
    | "tool_result"
    | "tool_error"
    | "done"
    | "error";
  content?: string;
  servers?: string[];
  name?: string;
  server?: string;
  status?: string;
  error?: string;
}
