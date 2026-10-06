import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerInviteTools(server: McpServer, api: ApiClient) {
  server.registerTool("list_invites", {
    title: "List pending invites", inputSchema: { workspaceId: z.string().optional(), boardId: z.string().optional() },
    annotations: { readOnlyHint: true, idempotentHint: true },
  }, async ({ workspaceId, boardId }) => {
    if ((workspaceId ? 1 : 0) + (boardId ? 1 : 0) !== 1) return toError("list_invites", new Error("provide exactly one of workspaceId or boardId"));
    try { return toJson(await api.get("/api/invites", { workspace_id: workspaceId, board_id: boardId })); }
    catch (err) { return toError("list_invites", err); }
  });
  server.registerTool("invite_user", {
    title: "Invite user", description: "Invite an email to a workspace or board; exactly one scope is required.",
    inputSchema: { email: z.string().email(), workspaceId: z.string().optional(), boardId: z.string().optional(), role: z.enum(["admin", "member"]).optional() },
  }, async (args) => {
    if ((args.workspaceId ? 1 : 0) + (args.boardId ? 1 : 0) !== 1) return toError("invite_user", new Error("provide exactly one of workspaceId or boardId"));
    try { return toJson(await api.post("/api/invites", args)); }
    catch (err) { return toError("invite_user", err); }
  });
  server.registerTool("revoke_invite", {
    title: "Revoke invite", inputSchema: { inviteId: z.string() }, annotations: { destructiveHint: true },
  }, async ({ inviteId }) => {
    try { return toJson(await api.delete(`/api/invites/${inviteId}`)); }
    catch (err) { return toError("revoke_invite", err); }
  });
}
