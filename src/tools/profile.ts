import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerProfileTools(server: McpServer, api: ApiClient) {
  server.registerTool("update_profile", {
    title: "Update profile", inputSchema: { name: z.string().min(1).optional(), email: z.string().email().optional(), image: z.string().nullable().optional() },
  }, async (patch) => {
    try { return toJson(await api.patch("/api/users/me", patch)); }
    catch (err) { return toError("update_profile", err); }
  });
  server.registerTool("get_notification_preferences", {
    title: "Get notification preferences", inputSchema: {}, annotations: { readOnlyHint: true, idempotentHint: true },
  }, async () => {
    try { return toJson(await api.get("/api/profile/notifications")); }
    catch (err) { return toError("get_notification_preferences", err); }
  });
  server.registerTool("set_notification_preference", {
    title: "Set notification preference", inputSchema: { eventType: z.string().min(1), emailEnabled: z.boolean() },
  }, async (args) => {
    try { return toJson(await api.patch("/api/profile/notifications", args)); }
    catch (err) { return toError("set_notification_preference", err); }
  });
}
