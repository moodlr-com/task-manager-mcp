import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

const sprintStatusEnum = z.enum(["planned", "active", "completed"]);

export function registerSprintTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_sprints",
    {
      title: "List sprints on a board",
      description:
        "Return every sprint on a board with its status (planned | active | completed), date range, goal, and task count. A board has at most one active sprint.",
      inputSchema: { boardId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ boardId }) => {
      try {
        const sprints = await api.get<unknown[]>("/api/sprints", {
          board_id: boardId,
        });
        return toJson(sprints);
      } catch (err) {
        return toError("list_sprints", err);
      }
    },
  );

  server.registerTool(
    "create_sprint",
    {
      title: "Create a sprint",
      description:
        "Create a new sprint on a board. The sprint starts in `planned` state and is added to the board's planned queue. Use `start_sprint` later to make it active.",
      inputSchema: {
        boardId: z.string(),
        name: z.string().min(1).describe("Sprint label, e.g. 'Sprint 12'"),
        startDate: z.string().describe("YYYY-MM-DD"),
        endDate: z
          .string()
          .describe("YYYY-MM-DD; must be on or after startDate"),
        goal: z.string().optional(),
      },
    },
    async (args) => {
      try {
        const sprint = await api.post<unknown>("/api/sprints", args);
        return toJson(sprint);
      } catch (err) {
        return toError("create_sprint", err);
      }
    },
  );

  server.registerTool(
    "update_sprint",
    {
      title: "Update a sprint",
      description:
        "Patch any subset of name/goal/startDate/endDate/status. Status transitions are gated: planned→active (only when no other active), active→completed (use `complete_sprint` for the proper flow). Backward transitions are blocked.",
      inputSchema: {
        sprintId: z.string(),
        name: z.string().optional(),
        goal: z.string().nullable().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        status: sprintStatusEnum.optional(),
      },
    },
    async ({ sprintId, ...patch }) => {
      try {
        const sprint = await api.patch<unknown>(
          `/api/sprints/${sprintId}`,
          patch,
        );
        return toJson(sprint);
      } catch (err) {
        return toError("update_sprint", err);
      }
    },
  );

  server.registerTool(
    "start_sprint",
    {
      title: "Start a sprint",
      description:
        "Activate a planned sprint (planned → active). Fails if another sprint is already active on the same board.",
      inputSchema: { sprintId: z.string() },
    },
    async ({ sprintId }) => {
      try {
        const sprint = await api.patch<unknown>(`/api/sprints/${sprintId}`, {
          status: "active",
        });
        return toJson(sprint);
      } catch (err) {
        return toError("start_sprint", err);
      }
    },
  );

  server.registerTool(
    "complete_sprint",
    {
      title: "Complete the active sprint",
      description:
        "Close an active sprint. Tasks already marked Done stay attached for history; non-Done tasks move to either the backlog or a chosen planned sprint on the same board.",
      inputSchema: {
        sprintId: z.string(),
        moveIncompleteTo: z
          .string()
          .default("backlog")
          .describe(
            "Either the literal 'backlog' (move to no-sprint) or the id of a planned sprint on the same board",
          ),
      },
    },
    async ({ sprintId, moveIncompleteTo }) => {
      try {
        const result = await api.post<unknown>(
          `/api/sprints/${sprintId}/complete`,
          { moveIncompleteTo },
        );
        return toJson(result);
      } catch (err) {
        return toError("complete_sprint", err);
      }
    },
  );

  server.registerTool(
    "delete_sprint",
    {
      title: "Delete a sprint",
      description:
        "Permanently delete a sprint. Tasks linked to it fall back to the backlog (sprintId = null) — they're not deleted.",
      inputSchema: { sprintId: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ sprintId }) => {
      try {
        await api.delete<void>(`/api/sprints/${sprintId}`);
        return toJson({ success: true, sprintId });
      } catch (err) {
        return toError("delete_sprint", err);
      }
    },
  );
}
