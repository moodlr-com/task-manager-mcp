import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerWorkspaceTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_workspaces",
    {
      title: "List workspaces",
      description:
        "Return every workspace the caller has access to. Super admins see everything; other users see workspaces they own, admin, or are a board member within.",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () => {
      try {
        const workspaces = await api.get<unknown[]>("/api/workspaces");
        return toJson(workspaces);
      } catch (err) {
        return toError("list_workspaces", err);
      }
    },
  );

  server.registerTool(
    "list_workspace_members",
    {
      title: "List workspace members",
      description:
        "Return the effective members of a workspace: super admins, workspace admins, and board members (via inheritance). Each row includes a role and a removable flag.",
      inputSchema: {
        workspaceId: z.string().describe("Workspace UUID"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ workspaceId }) => {
      try {
        const members = await api.get<unknown[]>(
          `/api/workspaces/${workspaceId}/members`,
        );
        return toJson(members);
      } catch (err) {
        return toError("list_workspace_members", err);
      }
    },
  );
}
