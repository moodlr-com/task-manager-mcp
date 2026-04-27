import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, "must be a #RRGGBB hex string");

export function registerTagTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description:
        "Return tags defined in a workspace, ordered by name.",
      inputSchema: {
        workspaceId: z.string().describe("Workspace UUID"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ workspaceId }) => {
      try {
        const tags = await api.get<unknown[]>("/api/tags", {
          workspace_id: workspaceId,
        });
        return toJson(tags);
      } catch (err) {
        return toError("list_tags", err);
      }
    },
  );

  server.registerTool(
    "create_tag",
    {
      title: "Create a tag",
      description:
        "Create a tag in a workspace. Idempotent: if a tag with the same name already exists, it is returned as-is. Use this before adding tags to a task if you do not know the tag id yet.",
      inputSchema: {
        workspaceId: z.string().describe("Workspace UUID"),
        name: z.string().min(1).describe("Tag name (case-sensitive)"),
        color: hexColor
          .optional()
          .describe("#RRGGBB; defaults to the standard tag palette"),
      },
    },
    async ({ workspaceId, name, color }) => {
      try {
        const tag = await api.post<unknown>("/api/tags", {
          workspaceId,
          name,
          color,
        });
        return toJson(tag);
      } catch (err) {
        return toError("create_tag", err);
      }
    },
  );

  server.registerTool(
    "update_tag",
    {
      title: "Rename or recolor a tag",
      description:
        "Update a tag's name and/or color. At least one of `name`/`color` must be provided.",
      inputSchema: {
        tagId: z.string(),
        name: z.string().min(1).optional(),
        color: hexColor.optional(),
      },
    },
    async ({ tagId, ...patch }) => {
      try {
        const result = await api.patch<unknown>(`/api/tags/${tagId}`, patch);
        return toJson(result);
      } catch (err) {
        return toError("update_tag", err);
      }
    },
  );

  server.registerTool(
    "delete_tag",
    {
      title: "Delete a tag",
      description:
        "Permanently delete a tag. The tag is removed from every task it was applied to. Requires workspace admin.",
      inputSchema: { tagId: z.string() },
      annotations: { destructiveHint: true },
    },
    async ({ tagId }) => {
      try {
        await api.delete<void>(`/api/tags/${tagId}`);
        return toJson({ success: true, tagId });
      } catch (err) {
        return toError("delete_tag", err);
      }
    },
  );
}
