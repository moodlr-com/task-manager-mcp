import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "./client.js";
import { registerWorkspaceTools } from "./tools/workspaces.js";
import { registerBoardTools } from "./tools/boards.js";
import { registerTaskTools } from "./tools/tasks.js";

const PACKAGE_VERSION = "0.1.0";

export function createServer(api: ApiClient): McpServer {
  const server = new McpServer(
    { name: "moodlr-task-manager", version: PACKAGE_VERSION },
    {
      capabilities: { logging: {} },
      instructions: [
        "You are connected to a Moodlr Task Manager workspace.",
        "",
        "Typical flow when asked to act on tasks:",
        "1. Call list_workspaces to find the relevant workspace.",
        "2. Call list_boards (optionally scoped by workspaceId) to find the board.",
        "3. Call list_statuses(boardId) so you know valid statusIds before moving tasks.",
        "4. Call list_tasks(boardId) to see what exists before creating duplicates.",
        "5. Use create_task / update_task / move_task / delete_task to mutate.",
        "",
        "statusId=null means the task is in the Backlog column.",
        "Dates are ISO strings (YYYY-MM-DD). Priority is one of low/medium/high/critical.",
      ].join("\n"),
    },
  );

  registerWorkspaceTools(server, api);
  registerBoardTools(server, api);
  registerTaskTools(server, api);

  return server;
}
