import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerSearchTools(server: McpServer, api: ApiClient) {
  server.registerTool("search", {
    title: "Search tasks and tags",
    description: "Search accessible tasks and tags across the account.",
    inputSchema: { query: z.string().min(1).max(200), limit: z.number().int().min(1).max(50).optional() },
    annotations: { readOnlyHint: true, idempotentHint: true },
  }, async ({ query, limit }) => {
    try { return toJson(await api.get("/api/search", { q: query, limit })); }
    catch (err) { return toError("search", err); }
  });
}
