import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ApiClient } from "./client.js";
import { registerWorkspaceTools } from "./tools/workspaces.js";
import { registerBoardTools } from "./tools/boards.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerTagTools } from "./tools/tags.js";
import { registerNotificationTools } from "./tools/notifications.js";
import { registerChecklistTools } from "./tools/checklist.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerActivityTools } from "./tools/activity.js";
import { registerSprintTools } from "./tools/sprints.js";
import { registerUserTools } from "./tools/users.js";

const PACKAGE_VERSION = "0.2.1";

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
        "",
        "Resolving people: list_users / find_user_by_email return user ids that you can pass as assigneeIds.",
        "Sprints are board-scoped; at most one is active per board (list_sprints / start_sprint / complete_sprint).",
        "Checklist items live under each task (list_checklist / add_checklist_item / toggle_checklist_item).",
        "Comments and activity timeline are also exposed (list_comments, list_task_activity).",
        "Bulk apply changes with bulk_update_tasks / bulk_delete_tasks instead of looping update_task.",
      ].join("\n"),
    },
  );

  registerWorkspaceTools(server, api);
  registerBoardTools(server, api);
  registerTaskTools(server, api);
  registerTagTools(server, api);
  registerNotificationTools(server, api);
  registerChecklistTools(server, api);
  registerCommentTools(server, api);
  registerActivityTools(server, api);
  registerSprintTools(server, api);
  registerUserTools(server, api);

  return server;
}
