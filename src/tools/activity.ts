import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerActivityTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_task_activity",
    {
      title: "List a task's activity timeline",
      description:
        "Return up to 100 activity events for a task (status changes, assignee changes, comments, checklist edits, etc.) ordered most-recent first. Each entry has { type, data, createdAt, user }.",
      inputSchema: { taskId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ taskId }) => {
      try {
        const activity = await api.get<unknown[]>(
          `/api/tasks/${taskId}/activity`,
        );
        return toJson(activity);
      } catch (err) {
        return toError("list_task_activity", err);
      }
    },
  );
}
