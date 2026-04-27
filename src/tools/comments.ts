import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerCommentTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_comments",
    {
      title: "List comments on a task",
      description:
        "Return non-deleted comments on a task in chronological order. Includes author { id, name, image }.",
      inputSchema: { taskId: z.string() },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ taskId }) => {
      try {
        const comments = await api.get<unknown[]>(
          `/api/tasks/${taskId}/comments`,
        );
        return toJson(comments);
      } catch (err) {
        return toError("list_comments", err);
      }
    },
  );

  server.registerTool(
    "add_comment",
    {
      title: "Add a comment to a task",
      description:
        "Post a comment on a task. The body is plain text or simple HTML; max 5000 characters. Notifies assignees.",
      inputSchema: {
        taskId: z.string(),
        body: z.string().min(1).max(5000),
      },
    },
    async ({ taskId, body }) => {
      try {
        const comment = await api.post<unknown>(
          `/api/tasks/${taskId}/comments`,
          { body },
        );
        return toJson(comment);
      } catch (err) {
        return toError("add_comment", err);
      }
    },
  );

  server.registerTool(
    "edit_comment",
    {
      title: "Edit a comment",
      description:
        "Replace the body of a comment. Only the original author (or a super admin) can edit.",
      inputSchema: {
        taskId: z.string(),
        commentId: z.string(),
        body: z.string().min(1).max(5000),
      },
    },
    async ({ taskId, commentId, body }) => {
      try {
        const updated = await api.patch<unknown>(
          `/api/tasks/${taskId}/comments/${commentId}`,
          { body },
        );
        return toJson(updated);
      } catch (err) {
        return toError("edit_comment", err);
      }
    },
  );

  server.registerTool(
    "delete_comment",
    {
      title: "Delete a comment",
      description:
        "Soft-delete a comment. Only the author or a super admin can delete.",
      inputSchema: {
        taskId: z.string(),
        commentId: z.string(),
      },
      annotations: { destructiveHint: true },
    },
    async ({ taskId, commentId }) => {
      try {
        await api.delete<void>(`/api/tasks/${taskId}/comments/${commentId}`);
        return toJson({ success: true, commentId });
      } catch (err) {
        return toError("delete_comment", err);
      }
    },
  );
}
