import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

const priorityEnum = z.enum(["low", "medium", "high", "critical"]);

export function registerTaskTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_tasks",
    {
      title: "List tasks",
      description:
        "Return tasks, optionally filtered by board, status, priority, assignee, tag, or search term. Without boardId, results are scoped to boards the caller can access.",
      inputSchema: {
        boardId: z.string().optional().describe("Board UUID"),
        statusId: z.string().optional().describe("Status UUID"),
        priority: priorityEnum.optional(),
        assigneeIds: z
          .array(z.string())
          .optional()
          .describe("Filter by one or more assignee user UUIDs"),
        tagIds: z
          .array(z.string())
          .optional()
          .describe("Filter by one or more tag UUIDs"),
        sprintId: z
          .string()
          .optional()
          .describe(
            "Sprint UUID, or the literal 'backlog' to match tasks not in any sprint",
          ),
        search: z
          .string()
          .optional()
          .describe("Case-insensitive match against title or description"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async (args) => {
      try {
        const tasks = await api.get<unknown[]>("/api/tasks", {
          board_id: args.boardId,
          status_id: args.statusId,
          priority: args.priority,
          assignee_id: args.assigneeIds,
          tag_id: args.tagIds,
          sprint_id: args.sprintId,
          search: args.search,
        });
        return toJson(tasks);
      } catch (err) {
        return toError("list_tasks", err);
      }
    },
  );

  server.registerTool(
    "list_assigned_to_me",
    {
      title: "List tasks assigned to the caller",
      description:
        "Cross-board feed of every task the caller is an assignee on (the personal 'Assigned to me' inbox). Includes board + workspace context per task and the joined status/sprint records.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () => {
      try {
        const tasks = await api.get<unknown[]>("/api/tasks/assigned-to-me");
        return toJson(tasks);
      } catch (err) {
        return toError("list_assigned_to_me", err);
      }
    },
  );

  server.registerTool(
    "create_task",
    {
      title: "Create task",
      description:
        "Create a task on a board. Omit statusId to start in the Backlog (status null). Assignees must have access to the board's workspace — the server silently drops foreign ids.",
      inputSchema: {
        boardId: z.string(),
        title: z.string().min(1),
        description: z.string().optional(),
        statusId: z
          .string()
          .nullable()
          .optional()
          .describe("null or omitted = Backlog"),
        groupId: z.string().optional(),
        priority: priorityEnum.optional().describe("Defaults to medium"),
        assigneeIds: z.array(z.string()).optional(),
        tagIds: z.array(z.string()).optional(),
        sprintId: z
          .string()
          .nullable()
          .optional()
          .describe(
            "Sprint UUID on the same board, or null/omitted for the backlog (no sprint)",
          ),
        startDate: z.string().optional().describe("YYYY-MM-DD"),
        dueDate: z
          .string()
          .optional()
          .describe("YYYY-MM-DD, must not precede startDate"),
      },
    },
    async (args) => {
      try {
        const task = await api.post<unknown>("/api/tasks", args);
        return toJson(task);
      } catch (err) {
        return toError("create_task", err);
      }
    },
  );

  server.registerTool(
    "update_task",
    {
      title: "Update task",
      description:
        "Patch any subset of fields on a task. Pass statusId=null to move the task to Backlog. Use this to move between columns, rename, retag, reassign, or change priority/dates.",
      inputSchema: {
        taskId: z.string(),
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        statusId: z.string().nullable().optional(),
        groupId: z.string().nullable().optional(),
        priority: priorityEnum.optional(),
        assigneeIds: z.array(z.string()).optional(),
        tagIds: z.array(z.string()).optional(),
        sprintId: z
          .string()
          .nullable()
          .optional()
          .describe("Sprint UUID on the same board; null sends to backlog"),
        startDate: z.string().nullable().optional(),
        dueDate: z.string().nullable().optional(),
      },
    },
    async ({ taskId, ...patch }) => {
      try {
        const task = await api.put<unknown>(`/api/tasks/${taskId}`, patch);
        return toJson(task);
      } catch (err) {
        return toError("update_task", err);
      }
    },
  );

  server.registerTool(
    "move_task",
    {
      title: "Move task to a status",
      description:
        "Convenience wrapper over update_task for the common 'move between Kanban columns' action. Pass statusId=null to send to Backlog.",
      inputSchema: {
        taskId: z.string(),
        statusId: z
          .string()
          .nullable()
          .describe("Status UUID, or null for Backlog"),
      },
    },
    async ({ taskId, statusId }) => {
      try {
        const task = await api.put<unknown>(`/api/tasks/${taskId}`, {
          statusId,
        });
        return toJson(task);
      } catch (err) {
        return toError("move_task", err);
      }
    },
  );

  server.registerTool(
    "delete_task",
    {
      title: "Delete task",
      description:
        "Permanently delete a task. Requires workspace_admin or super_admin on the parent workspace.",
      inputSchema: {
        taskId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ taskId }) => {
      try {
        await api.delete<void>(`/api/tasks/${taskId}`);
        return toJson({ success: true, taskId });
      } catch (err) {
        return toError("delete_task", err);
      }
    },
  );

  server.registerTool(
    "bulk_update_tasks",
    {
      title: "Apply the same update to many tasks",
      description:
        "Patch every task in `taskIds` with the same `update` payload. Status/priority/dates/sprint are replaced; addAssigneeIds/addTagIds are merged on top of the task's existing set (they don't replace). The server skips tasks the caller doesn't have access to and silently drops invalid status/tag/assignee ids per task.",
      inputSchema: {
        taskIds: z.array(z.string()).min(1),
        update: z
          .object({
            statusId: z.string().nullable().optional(),
            priority: priorityEnum.optional(),
            startDate: z.string().nullable().optional(),
            dueDate: z.string().nullable().optional(),
            sprintId: z.string().nullable().optional(),
            addAssigneeIds: z.array(z.string()).optional(),
            addTagIds: z.array(z.string()).optional(),
          })
          .refine(
            (u) => Object.keys(u).length > 0,
            "update must contain at least one field",
          ),
      },
    },
    async (args) => {
      try {
        const result = await api.post<unknown>("/api/tasks/bulk", args);
        return toJson(result);
      } catch (err) {
        return toError("bulk_update_tasks", err);
      }
    },
  );

  server.registerTool(
    "bulk_delete_tasks",
    {
      title: "Delete many tasks at once",
      description:
        "Delete every task in `taskIds`. Per-task auth still applies — only tasks on boards where the caller is workspace_admin or super_admin get removed; the rest are silently skipped. Returns the count actually deleted.",
      inputSchema: { taskIds: z.array(z.string()).min(1) },
      annotations: { destructiveHint: true },
    },
    async ({ taskIds }) => {
      try {
        const result = await api.delete<unknown>("/api/tasks/bulk", { taskIds });
        return toJson(result);
      } catch (err) {
        return toError("bulk_delete_tasks", err);
      }
    },
  );
}
