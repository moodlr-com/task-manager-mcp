import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerGroupTools(server: McpServer, api: ApiClient) {
  server.registerTool("list_groups", {
    title: "List board groups",
    description: "Return the swimlane/groups configured on a board.",
    inputSchema: { boardId: z.string() },
    annotations: { readOnlyHint: true, idempotentHint: true },
  }, async ({ boardId }) => {
    try { return toJson(await api.get(`/api/groups`, { board_id: boardId })); }
    catch (err) { return toError("list_groups", err); }
  });

  server.registerTool("create_group", {
    title: "Create a board group",
    description: "Create a swimlane/group on a board. Requires board admin access.",
    inputSchema: { boardId: z.string(), name: z.string().min(1), order: z.number().int().optional() },
  }, async (args) => {
    try { return toJson(await api.post("/api/groups", args)); }
    catch (err) { return toError("create_group", err); }
  });

  server.registerTool("reorder_tasks", {
    title: "Reorder tasks",
    description: "Persist the full task order for one board.",
    inputSchema: { boardId: z.string(), orderedIds: z.array(z.string()) },
  }, async (args) => {
    try { return toJson(await api.post("/api/tasks/reorder", args)); }
    catch (err) { return toError("reorder_tasks", err); }
  });
}
