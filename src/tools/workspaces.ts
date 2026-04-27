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

  server.registerTool(
    "add_workspace_member",
    {
      title: "Add a user to a workspace",
      description:
        "Grant a user workspace-level access. Default role is `member` (read-only across every board); pass `admin` to allow them to manage boards/tags/members. Personal workspaces can't have additional members.",
      inputSchema: {
        workspaceId: z.string(),
        userId: z.string(),
        role: z
          .enum(["admin", "member"])
          .optional()
          .describe("Defaults to 'member'"),
      },
    },
    async ({ workspaceId, userId, role }) => {
      try {
        const result = await api.post<unknown>(
          `/api/workspaces/${workspaceId}/members`,
          { userId, role },
        );
        return toJson(result);
      } catch (err) {
        return toError("add_workspace_member", err);
      }
    },
  );

  server.registerTool(
    "update_workspace_member_role",
    {
      title: "Promote or demote a workspace member",
      description:
        "Change a workspace member's role between admin and member. Demoting the last remaining admin is refused.",
      inputSchema: {
        workspaceId: z.string(),
        userId: z.string(),
        role: z.enum(["admin", "member"]),
      },
    },
    async ({ workspaceId, userId, role }) => {
      try {
        const result = await api.patch<unknown>(
          `/api/workspaces/${workspaceId}/members`,
          { userId, role },
        );
        return toJson(result);
      } catch (err) {
        return toError("update_workspace_member_role", err);
      }
    },
  );

  server.registerTool(
    "remove_workspace_member",
    {
      title: "Remove a workspace member",
      description:
        "Revoke a user's workspace access. Removing the last admin on the workspace is refused.",
      inputSchema: {
        workspaceId: z.string(),
        userId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ workspaceId, userId }) => {
      try {
        await api.delete<void>(
          `/api/workspaces/${workspaceId}/members`,
          { userId },
        );
        return toJson({ success: true, workspaceId, userId });
      } catch (err) {
        return toError("remove_workspace_member", err);
      }
    },
  );
}
