import { NextRequest } from "next/server";
import OpenAI from "openai";
import { auth } from "@/lib/auth";
import { getAllMCPTools, callMCPTool, mcpToolsToOpenAIFormat } from "@/lib/mcp-client";

export const runtime = "nodejs";
export const maxDuration = 120;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function buildSystemPrompt(userName: string, userEmail: string): string {
  return `You are Rall-E, the intelligent assistant for the Rally team dashboard. You have access to the team's Atlassian (Jira/Confluence) workspace through connected tools.

You help the team by:
- Checking Jira tickets, sprint status, and project progress
- Finding documentation in Confluence
- Answering questions about the project's development status

The current user is ${userName} (${userEmail}).

Be concise, helpful, and specific. When referencing designs or tickets, include relevant details. Format responses with markdown when helpful.`;
}

const MODEL = "gpt-5.4-nano";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { messages } = (await request.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
      };

      try {
        const mcpTools = await getAllMCPTools();
        const { tools, toolServerMap } = mcpToolsToOpenAIFormat(mcpTools);

        send({ type: "servers", servers: mcpTools.map((s) => s.serverName) });

        const systemPrompt = buildSystemPrompt(
          session.user?.name || "a team member",
          session.user?.email || "",
        );

        type OpenAIMessage = OpenAI.Chat.ChatCompletionMessageParam;

        let openaiMessages: OpenAIMessage[] = [
          { role: "system", content: systemPrompt },
          ...messages.map((m) => ({ role: m.role, content: m.content } as OpenAIMessage)),
        ];

        // Agentic tool-use loop
        let continueLoop = true;
        while (continueLoop) {
          // Accumulate streamed chunks
          const streamResponse = await openai.chat.completions.create({
            model: MODEL,
            messages: openaiMessages,
            ...(tools.length > 0 ? { tools } : { reasoning_effort: "medium" as never }),
            max_completion_tokens: 4096,
            stream: true,
          });

          let assistantContent = "";
          const toolCallsAcc: Record<
            number,
            { id: string; name: string; argumentsRaw: string }
          > = {};
          let finishReason: string | null = null;

          for await (const chunk of streamResponse) {
            const delta = chunk.choices[0]?.delta;
            finishReason = chunk.choices[0]?.finish_reason ?? finishReason;

            if (delta?.content) {
              assistantContent += delta.content;
              send({ type: "text_delta", content: delta.content });
            }

            if (delta?.tool_calls) {
              for (const tc of delta.tool_calls) {
                if (!toolCallsAcc[tc.index]) {
                  toolCallsAcc[tc.index] = { id: "", name: "", argumentsRaw: "" };
                }
                if (tc.id) toolCallsAcc[tc.index].id = tc.id;
                if (tc.function?.name) toolCallsAcc[tc.index].name += tc.function.name;
                if (tc.function?.arguments) toolCallsAcc[tc.index].argumentsRaw += tc.function.arguments;
              }
            }
          }

          const resolvedToolCalls = Object.values(toolCallsAcc);

          if (finishReason === "tool_calls" && resolvedToolCalls.length > 0) {
            // Append assistant message with tool_calls
            openaiMessages.push({
              role: "assistant",
              content: assistantContent || null,
              tool_calls: resolvedToolCalls.map((tc) => ({
                id: tc.id,
                type: "function" as const,
                function: { name: tc.name, arguments: tc.argumentsRaw },
              })),
            });

            // Execute each tool call and collect results
            for (const tc of resolvedToolCalls) {
              const serverName = toolServerMap.get(tc.name) || "unknown";
              send({ type: "tool_call", name: tc.name, server: serverName, status: "calling" });

              let resultContent: string;
              try {
                const args = JSON.parse(tc.argumentsRaw || "{}") as Record<string, unknown>;
                const result = await callMCPTool(serverName, tc.name, args);
                resultContent =
                  typeof result.content === "string"
                    ? result.content
                    : JSON.stringify(result.content);
                send({ type: "tool_result", name: tc.name, server: serverName, status: "done" });
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Unknown error";
                resultContent = `Error: ${message}`;
                send({ type: "tool_error", name: tc.name, error: message });
              }

              openaiMessages.push({
                role: "tool",
                tool_call_id: tc.id,
                content: resultContent,
              });
            }
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
