import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

interface MCPHttpConfig {
  name: string;
  url: string;
  headers?: Record<string, string>;
}

interface MCPConnection {
  client: Client;
  tools: MCPTool[];
}

interface MCPTool {
  name: string;
  description?: string;
  inputSchema: Record<string, unknown>;
}

// Module-level cache
const connections = new Map<string, MCPConnection>();

function getServerConfigs(): MCPHttpConfig[] {
  const configs: MCPHttpConfig[] = [];

  const saEmail = process.env.JIRA_SA_EMAIL || process.env.JIRA_EMAIL;
  const saToken = process.env.JIRA_SA_API_TOKEN || process.env.JIRA_API_TOKEN;

  if (saToken && saEmail) {
    const basicAuth = Buffer.from(`${saEmail}:${saToken}`).toString("base64");

    configs.push({
      name: "atlassian",
      url: "https://mcp.atlassian.com/v1/mcp",
      headers: {
        Authorization: `Basic ${basicAuth}`,
      },
    });
  }

  return configs;
}

async function connectToServer(
  config: MCPHttpConfig,
): Promise<MCPConnection> {
  const existing = connections.get(config.name);
  if (existing) return existing;

  const transport = new StreamableHTTPClientTransport(
    new URL(config.url),
    config.headers
      ? { requestInit: { headers: config.headers } }
      : undefined,
  );

  const client = new Client(
    { name: "rally-dashboard", version: "1.0.0" },
    { capabilities: {} },
  );

  await client.connect(transport);

  const { tools } = await client.listTools();

  const connection: MCPConnection = { client, tools: tools as MCPTool[] };
  connections.set(config.name, connection);

  return connection;
}

/**
 * Connect to all configured MCP servers and return their tools.
 */
export async function getAllMCPTools(): Promise<
  { serverName: string; tools: MCPTool[] }[]
> {
  const configs = getServerConfigs();
  const results: { serverName: string; tools: MCPTool[] }[] = [];

  for (const config of configs) {
    try {
      const conn = await connectToServer(config);
      results.push({ serverName: config.name, tools: conn.tools });
    } catch (error) {
      console.error(`[MCP] Failed to connect to ${config.name}:`, error);
    }
  }

  return results;
}

/**
 * Call a tool on a specific MCP server.
 */
export async function callMCPTool(
  serverName: string,
  toolName: string,
  args: Record<string, unknown>,
): Promise<{ content: unknown }> {
  const conn = connections.get(serverName);
  if (!conn) {
    throw new Error(`MCP server "${serverName}" is not connected`);
  }

  const result = await conn.client.callTool({
    name: toolName,
    arguments: args,
  });

  return result as { content: unknown };
}

/**
 * Convert MCP tools into Anthropic-compatible tool definitions
 * and build a map from tool name → server name.
 */
export function mcpToolsToAnthropicFormat(
  mcpTools: { serverName: string; tools: MCPTool[] }[],
) {
  const tools: {
    name: string;
    description: string;
    input_schema: Record<string, unknown>;
  }[] = [];
  const toolServerMap = new Map<string, string>();

  for (const { serverName, tools: serverTools } of mcpTools) {
    for (const tool of serverTools) {
      tools.push({
        name: tool.name,
        description: tool.description || "",
        input_schema: tool.inputSchema || { type: "object", properties: {} },
      });
      toolServerMap.set(tool.name, serverName);
    }
  }

  return { tools, toolServerMap };
}
