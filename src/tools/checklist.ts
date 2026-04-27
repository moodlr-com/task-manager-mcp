import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerChecklistTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_checklist",
    {
      title: "List a task's checklist",
      description:
        "Return checklist items for a task in the order they appear. Items are simple { id, title, isDone, order }.",
      inputSchema: {
        taskId: z.string(),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ taskId }) => {
      try {
        const items = await api.get<unknown[]>(
          `/api/tasks/${taskId}/checklist`,
        );
        return toJson(items);
      } catch (err) {
        return toError("list_checklist", err);
      }
    },
  );

  server.registerTool(
    "add_checklist_item",
    {
      title: "Add a checklist item",
      description:
        "Append a new item to a task's checklist. The new item is created at the end of the list.",
      inputSchema: {
        taskId: z.string(),
        title: z
          .string()
          .min(1)
          .max(500)
          .describe("Item label (max 500 chars)"),
      },
    },
    async ({ taskId, title }) => {
      try {
        const item = await api.post<unknown>(
          `/api/tasks/${taskId}/checklist`,
          { title },
        );
        return toJson(item);
      } catch (err) {
        return toError("add_checklist_item", err);
      }
    },
  );

  server.registerTool(
    "toggle_checklist_item",
    {
      title: "Mark a checklist item done/undone",
      description:
        "Flip or set the `isDone` flag of a checklist item. Pass `isDone` explicitly to force a value; otherwise the item is toggled relative to its current state.",
      inputSchema: {
        taskId: z.string(),
        itemId: z.string(),
        isDone: z
          .boolean()
          .optional()
          .describe("Explicit value; omit to toggle"),
      },
    },
    async ({ taskId, itemId, isDone }) => {
      try {
        let target = isDone;
        if (target === undefined) {
          // Toggle requires the current state — list once and resolve.
          const items = await api.get<{ id: string; isDone: boolean }[]>(
            `/api/tasks/${taskId}/checklist`,
          );
          const current = items.find((i) => i.id === itemId);
          if (!current) {
            return toError(
              "toggle_checklist_item",
              new Error("checklist item not found"),
            );
          }
          target = !current.isDone;
        }
        const updated = await api.patch<unknown>(
          `/api/tasks/${taskId}/checklist/${itemId}`,
          { isDone: target },
        );
        return toJson(updated);
      } catch (err) {
        return toError("toggle_checklist_item", err);
      }
    },
  );

  server.registerTool(
    "rename_checklist_item",
    {
      title: "Rename a checklist item",
      description: "Change the title of a checklist item.",
      inputSchema: {
        taskId: z.string(),
        itemId: z.string(),
        title: z.string().min(1).max(500),
      },
    },
    async ({ taskId, itemId, title }) => {
      try {
        const updated = await api.patch<unknown>(
          `/api/tasks/${taskId}/checklist/${itemId}`,
          { title },
        );
        return toJson(updated);
      } catch (err) {
        return toError("rename_checklist_item", err);
      }
    },
  );

  server.registerTool(
    "remove_checklist_item",
    {
      title: "Delete a checklist item",
      description: "Permanently remove a checklist item from a task.",
      inputSchema: {
        taskId: z.string(),
        itemId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ taskId, itemId }) => {
      try {
        await api.delete<void>(`/api/tasks/${taskId}/checklist/${itemId}`);
        return toJson({ success: true, itemId });
      } catch (err) {
        return toError("remove_checklist_item", err);
      }
    },
  );

  server.registerTool(
    "reorder_checklist",
    {
      title: "Reorder a task's checklist",
      description:
        "Replace the order of checklist items in one shot. Pass the full list of itemIds in the desired order.",
      inputSchema: {
        taskId: z.string(),
        orderedIds: z.array(z.string()).min(1),
      },
    },
    async ({ taskId, orderedIds }) => {
      try {
        const result = await api.post<unknown>(
          `/api/tasks/${taskId}/checklist/reorder`,
          { orderedIds },
        );
        return toJson(result);
      } catch (err) {
        return toError("reorder_checklist", err);
      }
    },
  );
}
