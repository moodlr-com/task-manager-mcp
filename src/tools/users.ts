import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

interface User {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export function registerUserTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_users",
    {
      title: "List users visible to the caller",
      description:
        "Return every user the caller can see (themselves + super admins + people sharing at least one accessible workspace). Useful for resolving names/emails to user ids before passing them as `assigneeIds`.",
      inputSchema: {
        search: z
          .string()
          .optional()
          .describe(
            "Case-insensitive substring match on name or email; applied client-side",
          ),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ search }) => {
      try {
        const users = await api.get<User[]>("/api/users");
        const filtered = search
          ? users.filter((u) => {
              const q = search.toLowerCase();
              return (
                u.name.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q)
              );
            })
          : users;
        return toJson(filtered);
      } catch (err) {
        return toError("list_users", err);
      }
    },
  );

  server.registerTool(
    "find_user_by_email",
    {
      title: "Resolve a user id from an email address",
      description:
        "Convenience lookup: returns { id, name, email, image } for a single user matched by exact (case-insensitive) email, or null when no visible user matches.",
      inputSchema: { email: z.string().email() },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ email }) => {
      try {
        const users = await api.get<User[]>("/api/users");
        const match =
          users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase(),
          ) ?? null;
        return toJson(match);
      } catch (err) {
        return toError("find_user_by_email", err);
      }
    },
  );

  server.registerTool(
    "whoami",
    {
      title: "Return the caller's own profile",
      description:
        "Resolve the user behind the API key — id, name, email, image. Useful when scripting actions that need to know the caller (e.g. self-assign).",
      inputSchema: {},
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async () => {
      try {
        const me = await api.get<unknown>("/api/users/me");
        return toJson(me);
      } catch (err) {
        return toError("whoami", err);
      }
    },
  );
}
