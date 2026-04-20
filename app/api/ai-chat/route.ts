import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";
import {
  getAllMCPTools,
  callMCPTool,
  mcpToolsToAnthropicFormat,
} from "@/lib/mcp-client";

export const runtime = "nodejs";
export const maxDuration = 120;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function buildSystemPrompt(userName: string, userEmail: string): string {
  return `You are Rally AI, the intelligent assistant for the Rally team dashboard. You have access to the team's Atlassian (Jira/Confluence) workspace through connected tools.

You help the team by:
- Checking Jira tickets, sprint status, and project progress
- Finding documentation in Confluence
- Answering questions about the project's development status

The current user is ${userName} (${userEmail}).

Be concise, helpful, and specific. When referencing designs or tickets, include relevant details. Format responses with markdown when helpful.`;
}

async function executeToolCalls(
  blocks: Anthropic.ContentBlock[],
  toolServerMap: Map<string, string>,
  send: (data: Record<string, unknown>) => void,
): Promise<Anthropic.ToolResultBlockParam[]> {
  const results: Anthropic.ToolResultBlockParam[] = [];

  for (const block of blocks) {
    if (block.type !== "tool_use") continue;

    const serverName = toolServerMap.get(block.name) || "unknown";
    send({ type: "tool_call", name: block.name, server: serverName, status: "calling" });

    try {
      const result = await callMCPTool(
        serverName,
        block.name,
        block.input as Record<string, unknown>,
      );

      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content:
          typeof result.content === "string"
            ? result.content
            : JSON.stringify(result.content),
      });

      send({ type: "tool_result", name: block.name, server: serverName, status: "done" });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";

      results.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: `Error: ${message}`,
        is_error: true,
      });

      send({ type: "tool_error", name: block.name, error: message });
    }
  }

  return results;
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { messages, model } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    model?: "sonnet" | "opus";
  };

  const MODELS: Record<string, Anthropic.Messages.Model> = {
    sonnet: "claude-sonnet-4-6",
    opus: "claude-opus-4-6",
  };
  const resolvedModel = MODELS[model || "sonnet"];

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const mcpTools = await getAllMCPTools();
        const { tools, toolServerMap } = mcpToolsToAnthropicFormat(mcpTools);

        send({ type: "servers", servers: mcpTools.map((s) => s.serverName) });

        const systemPrompt = buildSystemPrompt(
          session.user?.name || "a team member",
          session.user?.email || "",
        );

        let anthropicMessages: Anthropic.MessageParam[] = messages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        // Agentic tool-use loop
        let continueLoop = true;
        while (continueLoop) {
          const response = anthropic.messages.stream({
            model: resolvedModel,
            max_tokens: 4096,
            system: systemPrompt,
            messages: anthropicMessages,
            ...(tools.length > 0 ? { tools: tools as Anthropic.Tool[] } : {}),
          });

          response.on("text", (text) => {
            send({ type: "text_delta", content: text });
          });

          const finalMessage = await response.finalMessage();

          if (finalMessage.stop_reason === "tool_use") {
            const toolResults = await executeToolCalls(
              finalMessage.content,
              toolServerMap,
              send,
            );

            anthropicMessages = [
              ...anthropicMessages,
              { role: "assistant", content: finalMessage.content },
              { role: "user", content: toolResults },
            ];
          } else {
            continueLoop = false;
          }
        }

        send({ type: "done" });
        controller.close();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        send({ type: "error", error: message });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
