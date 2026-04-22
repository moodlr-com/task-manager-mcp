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
        "Return the status columns defined on a board, in their configured order. Use the returned ids to move tasks between columns.",
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
}
