# Moodlr Task Manager MCP

The MCP server exposes the Task Manager API through stdio for Claude Desktop, Claude Code and other MCP clients. It authenticates with the same personal API key used by the REST API, so permissions are inherited from the user who created the key.

## Setup

Create a personal token in Task Manager under **Credentials**. Store it in the client configuration; it is shown only once.

```json
{
  "mcpServers": {
    "moodlr": {
      "command": "npx",
      "args": ["-y", "@moodlr/task-manager-mcp"],
      "env": {
        "MOODLR_API_URL": "https://tasks.moodlr.com",
        "MOODLR_API_KEY": "moodlr_..."
      }
    }
  }
}
```

The existing token remains valid after an MCP or API deployment. Generate a new one only if the old token was lost or revoked. `MOODLR_API_TIMEOUT_MS` optionally changes the HTTP timeout; the default is 30 seconds.

## Normal task flow

1. `list_workspaces` and `list_boards` locate the destination.
2. `list_statuses`, `list_groups`, `list_tags`, `list_users` and `list_sprints` resolve valid IDs.
3. `create_task` accepts rich HTML in `description`, multiple assignees/tags, priority, status, group, sprint and `YYYY-MM-DD` dates.
4. `add_checklist_item` and `add_comment` add execution detail.
5. `update_task`, `move_task`, `complete_task`, `reopen_task` and `bulk_update_tasks` change work state.
6. `get_task`, `list_task_activity`, `list_comments` and `list_checklist` verify the result.

`complete_task` resolves the unique canonical Done status on the task's board. `reopen_task` resolves To Do. Use `move_task` when a specific status ID is required. A task with no status is in Backlog.

## Tool catalogue

### Workspaces and boards

`list_workspaces`, `get_workspace`, `create_workspace`, `update_workspace`, `delete_workspace`, `list_workspace_members`, `add_workspace_member`, `update_workspace_member_role`, `remove_workspace_member`, `list_boards`, `list_board_members`, `list_statuses`, `create_board`, `update_board`, `delete_board`, `add_board_member`, `remove_board_member`, `list_groups`, `create_group`, `reorder_tasks`.

### Tasks and execution detail

`get_task`, `list_tasks`, `list_assigned_to_me`, `create_task`, `update_task`, `move_task`, `complete_task`, `reopen_task`, `delete_task`, `bulk_update_tasks`, `bulk_delete_tasks`, `list_checklist`, `add_checklist_item`, `toggle_checklist_item`, `rename_checklist_item`, `remove_checklist_item`, `reorder_checklist`, `list_comments`, `add_comment`, `edit_comment`, `delete_comment`, `list_task_activity`.

### Tags, sprints and account operations

`list_tags`, `create_tag`, `update_tag`, `delete_tag`, `list_sprints`, `create_sprint`, `update_sprint`, `start_sprint`, `complete_sprint`, `delete_sprint`, `search`, `list_saved_filters`, `create_saved_filter`, `delete_saved_filter`, `list_invites`, `invite_user`, `revoke_invite`, `list_users`, `find_user_by_email`, `whoami`, `update_profile`, `list_notifications`, `mark_notification_read`, `mark_all_notifications_read`, `delete_notification`, `get_notification_preferences`, `set_notification_preference`.

## Safety and permissions

The MCP does not bypass Task Manager authorization. Board and workspace membership, admin-only mutations, personal-workspace restrictions, valid status/tag/assignee relationships and destructive-operation permissions remain enforced by the API. Delete tools are marked destructive in MCP metadata. API-key minting/revocation, authentication, password reset, file upload, seed and health endpoints are intentionally not exposed as task-management tools.

## Development and release

```bash
npm ci
npm run build
```

The MCP package publishes from a version tag. Update `package.json`, commit and push the tag matching the version, for example `v0.3.0`. The workflow builds before publishing. The Task Manager deploys from `main`; deploy that repository when changing its API, including `GET /api/tasks/:id` and API-key-compatible profile access.
