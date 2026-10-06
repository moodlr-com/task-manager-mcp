import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

const filters = z.object({
  statusIds: z.array(z.string()).optional(), priorities: z.array(z.string()).optional(),
  assigneeIds: z.array(z.string()).optional(), tagIds: z.array(z.string()).optional(),
  search: z.string().max(200).optional(),
}).strict();

export function registerSavedFilterTools(server: McpServer, api: ApiClient) {
  server.registerTool("list_saved_filters", {
    title: "List saved filters", inputSchema: { boardId: z.string().optional() },
    annotations: { readOnlyHint: true, idempotentHint: true },
  }, async ({ boardId }) => {
    try { return toJson(await api.get("/api/saved-filters", { board_id: boardId })); }
    catch (err) { return toError("list_saved_filters", err); }
  });
  server.registerTool("create_saved_filter", {
    title: "Create saved filter", inputSchema: { name: z.string().min(1).max(80), boardId: z.string().nullable().optional(), filters },
  }, async (args) => {
    try { return toJson(await api.post("/api/saved-filters", args)); }
    catch (err) { return toError("create_saved_filter", err); }
  });
  server.registerTool("delete_saved_filter", {
    title: "Delete saved filter", inputSchema: { filterId: z.string() }, annotations: { destructiveHint: true },
  }, async ({ filterId }) => {
    try { await api.delete(`/api/saved-filters/${filterId}`); return toJson({ success: true, filterId }); }
    catch (err) { return toError("delete_saved_filter", err); }
  });
}
