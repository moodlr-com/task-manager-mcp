import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

export function registerTagTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_tags",
    {
      title: "List tags",
      description:
        "Return tags defined in a workspace. Pass includeDeleted=true to also surface soft-deleted tags (trash bin).",
      inputSchema: {
        workspaceId: z.string().describe("Workspace UUID"),
        includeDeleted: z
          .boolean()
          .optional()
          .describe("Include soft-deleted tags (default: false)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ workspaceId, includeDeleted }) => {
      try {
        const tags = await api.get<unknown[]>("/api/tags", {
          workspace_id: workspaceId,
          deleted: includeDeleted ? "true" : undefined,
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
      title: "Create or restore a tag",
      description:
        "Create a tag in a workspace. Idempotent: if a tag with the same name already exists, it is returned as-is; if it was soft-deleted, it is restored. Use this before adding tags to a task if you do not know the tag id yet.",
      inputSchema: {
        workspaceId: z.string().describe("Workspace UUID"),
        name: z.string().min(1).describe("Tag name (case-sensitive)"),
      },
    },
    async ({ workspaceId, name }) => {
      try {
        const tag = await api.post<unknown>("/api/tags", {
          workspaceId,
          name,
        });
        return toJson(tag);
      } catch (err) {
        return toError("create_tag", err);
      }
    },
  );
}
