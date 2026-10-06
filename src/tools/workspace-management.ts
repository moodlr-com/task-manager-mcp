import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).optional();

export function registerWorkspaceManagementTools(server: McpServer, api: ApiClient) {
  server.registerTool("get_workspace", {
    title: "Get workspace",
    inputSchema: { workspaceId: z.string() },
    annotations: { readOnlyHint: true, idempotentHint: true },
  }, async ({ workspaceId }) => {
    try { return toJson(await api.get(`/api/workspaces/${workspaceId}`)); }
    catch (err) { return toError("get_workspace", err); }
  });

  server.registerTool("create_workspace", {
    title: "Create workspace",
    description: "Create a workspace. Requires super-admin access.",
    inputSchema: { name: z.string().min(1), description: z.string().optional(), color, icon: z.string().optional() },
  }, async (args) => {
    try { return toJson(await api.post("/api/workspaces", args)); }
    catch (err) { return toError("create_workspace", err); }
  });

  server.registerTool("update_workspace", {
    title: "Update workspace",
    inputSchema: { workspaceId: z.string(), name: z.string().min(1).optional(), description: z.string().nullable().optional(), color, icon: z.string().optional() },
  }, async ({ workspaceId, ...patch }) => {
    try { return toJson(await api.put(`/api/workspaces/${workspaceId}`, patch)); }
    catch (err) { return toError("update_workspace", err); }
  });

  server.registerTool("delete_workspace", {
    title: "Delete workspace",
    description: "Permanently delete a workspace and its boards/tasks. Requires workspace admin.",
    inputSchema: { workspaceId: z.string() }, annotations: { destructiveHint: true },
  }, async ({ workspaceId }) => {
    try { return toJson(await api.delete(`/api/workspaces/${workspaceId}`)); }
    catch (err) { return toError("delete_workspace", err); }
  });
}
