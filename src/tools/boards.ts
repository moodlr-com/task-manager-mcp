import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerBoardTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_boards",
    {
      title: "List boards",
      description:
        "Return boards the caller can access, optionally scoped to a workspace.",
      inputSchema: {
        workspaceId: z
          .string()
          .optional()
          .describe("Optional workspace UUID to filter boards"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ workspaceId }) => {
      try {
        const boards = await api.get<unknown[]>("/api/boards", {
          workspace_id: workspaceId,
        });
        return toJson(boards);
      } catch (err) {
        return toError("list_boards", err);
      }
    },
  );

  server.registerTool(
    "list_board_members",
    {
      title: "List board members",
      description:
        "Return everyone with access to the board: super admins, workspace admins (inherited), and explicit board members.",
      inputSchema: {
        boardId: z.string().describe("Board UUID"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ boardId }) => {
      try {
        const members = await api.get<unknown[]>(
          `/api/boards/${boardId}/members`,
        );
        return toJson(members);
      } catch (err) {
        return toError("list_board_members", err);
      }
    },
  );

  server.registerTool(
    "list_statuses",
    {
      title: "List statuses of a board",
      description:
        "Return the status columns defined on a board, in their configured order. Use the returned ids to move tasks between columns. Boards always carry the canonical 6-status set (To Do, In Progress, QA, Blocked, Ready for Deployment, Done) — Backlog is statusId=null.",
      inputSchema: {
        boardId: z.string().describe("Board UUID"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ boardId }) => {
      try {
        const statuses = await api.get<unknown[]>(`/api/statuses`, {
          board_id: boardId,
        });
        return toJson(statuses);
      } catch (err) {
        return toError("list_statuses", err);
      }
    },
  );

  server.registerTool(
    "create_board",
    {
      title: "Create a board",
      description:
        "Create a new board on a workspace. The board is auto-seeded with the canonical 6-status set. Requires workspace_admin or super_admin on the workspace.",
      inputSchema: {
        workspaceId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        icon: z
          .string()
          .optional()
          .describe("Emoji or image URL; defaults to 📋"),
      },
    },
    async (args) => {
      try {
        const board = await api.post<unknown>("/api/boards", args);
        return toJson(board);
      } catch (err) {
        return toError("create_board", err);
      }
    },
  );

  server.registerTool(
    "update_board",
    {
      title: "Update a board",
      description:
        "Patch board name/description/color/icon. Requires workspace admin on the parent workspace.",
      inputSchema: {
        boardId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
        icon: z.string().optional(),
      },
    },
    async ({ boardId, ...patch }) => {
      try {
        const board = await api.put<unknown>(`/api/boards/${boardId}`, patch);
        return toJson(board);
      } catch (err) {
        return toError("update_board", err);
      }
    },
  );

  server.registerTool(
    "delete_board",
    {
      title: "Delete a board",
      description:
        "Permanently delete a board and every task on it. Requires workspace admin.",
      inputSchema: { boardId: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ boardId }) => {
      try {
        await api.delete<void>(`/api/boards/${boardId}`);
        return toJson({ success: true, boardId });
      } catch (err) {
        return toError("delete_board", err);
      }
    },
  );

  server.registerTool(
    "add_board_member",
    {
      title: "Add a user as a board member",
      description:
        "Grant a user board-only access. Workspace admins already see every board automatically — board members are for users who should only see this one board.",
      inputSchema: {
        boardId: z.string(),
        userId: z.string(),
      },
    },
    async ({ boardId, userId }) => {
      try {
        const member = await api.post<unknown>(
          `/api/boards/${boardId}/members`,
          { userId },
        );
        return toJson(member);
      } catch (err) {
        return toError("add_board_member", err);
      }
    },
  );

  server.registerTool(
    "remove_board_member",
    {
      title: "Remove a board member",
      description:
        "Revoke a user's explicit board-level access. Has no effect on users who already access the board through workspace membership or super-admin status.",
      inputSchema: {
        boardId: z.string(),
        userId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ boardId, userId }) => {
      try {
        await api.delete<void>(`/api/boards/${boardId}/members`, { userId });
        return toJson({ success: true, boardId, userId });
      } catch (err) {
        return toError("remove_board_member", err);
      }
    },
  );
}
