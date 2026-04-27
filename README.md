# @moodlr/task-manager-mcp

MCP server for the [Moodlr Task Manager](https://github.com/moodlr-com/task-manager).
Read, create, edit, and move tasks from any MCP-compatible client
(Claude Desktop, Claude Code, others).

## Prerequisites

- Node.js 20+
- An API key generated in the Task Manager (token starts with `moodlr_`)

## Generating an API key

1. Open the Task Manager dashboard.
2. Click your avatar in the header → **Credentials**.
3. Type a label (e.g. `mcp-laptop`) and click **Create**.
4. **Copy the token immediately** — there's no way to recover it later.
5. To revoke: same screen, click the trash icon.

## Claude Desktop setup

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "moodlr": {
      "command": "npx",
      "args": ["-y", "@moodlr/task-manager-mcp"],
      "env": {
        "MOODLR_API_URL": "https://tasks.moodlr.com",
        "MOODLR_API_KEY": "moodlr_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

Restart Claude Desktop. The tools become available immediately.

## Claude Code setup

Add to the project's `.mcp.json` (or `~/.claude.json`):

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

## Available tools

### Workspaces
- `list_workspaces` — workspaces the caller can access
- `list_workspace_members({ workspaceId })`
- `add_workspace_member({ workspaceId, userId, role? })` — role: admin | member (defaults to member)
- `update_workspace_member_role({ workspaceId, userId, role })`
- `remove_workspace_member({ workspaceId, userId })`

### Boards
- `list_boards({ workspaceId? })`
- `list_board_members({ boardId })`
- `list_statuses({ boardId })` — always returns the canonical 6-status set
- `create_board({ workspaceId, name, description?, color?, icon? })`
- `update_board({ boardId, ...fields })`
- `delete_board({ boardId })`
- `add_board_member({ boardId, userId })`
- `remove_board_member({ boardId, userId })`

### Tasks
- `list_tasks({ boardId?, statusId?, priority?, assigneeIds?, tagIds?, sprintId?, search? })`
- `list_assigned_to_me()` — cross-board feed for the current assignee
- `create_task({ boardId, title, description?, statusId?, groupId?, priority?, assigneeIds?, tagIds?, sprintId?, startDate?, dueDate? })`
- `update_task({ taskId, ...fields })` — partial patch; accepts `sprintId`
- `move_task({ taskId, statusId })` — column shortcut (statusId=null = Backlog)
- `delete_task({ taskId })` — admin only
- `bulk_update_tasks({ taskIds, update })` — `update.addAssigneeIds`/`addTagIds` merge with the existing set; `statusId`/`priority`/`sprintId`/dates overwrite
- `bulk_delete_tasks({ taskIds })`

### Checklist (subtasks)
- `list_checklist({ taskId })`
- `add_checklist_item({ taskId, title })`
- `toggle_checklist_item({ taskId, itemId, isDone? })` — omit `isDone` to flip
- `rename_checklist_item({ taskId, itemId, title })`
- `remove_checklist_item({ taskId, itemId })`
- `reorder_checklist({ taskId, orderedIds })`

### Comments
- `list_comments({ taskId })`
- `add_comment({ taskId, body })`
- `edit_comment({ taskId, commentId, body })`
- `delete_comment({ taskId, commentId })`

### Activity
- `list_task_activity({ taskId })`

### Sprints
- `list_sprints({ boardId })`
- `create_sprint({ boardId, name, startDate, endDate, goal? })`
- `update_sprint({ sprintId, ...fields })`
- `start_sprint({ sprintId })` — planned → active
- `complete_sprint({ sprintId, moveIncompleteTo })` — `moveIncompleteTo`: `"backlog"` or a planned sprintId
- `delete_sprint({ sprintId })`

### Tags
- `list_tags({ workspaceId })`
- `create_tag({ workspaceId, name, color? })` — idempotent
- `update_tag({ tagId, name?, color? })`
- `delete_tag({ tagId })`

### Users
- `list_users({ search? })`
- `find_user_by_email({ email })`
- `whoami()`

### Notifications
- `list_notifications({ unreadOnly? })`
- `mark_notification_read({ notificationId })`
- `mark_all_notifications_read()`
- `delete_notification({ notificationId })`

## Development

```bash
git clone https://github.com/moodlr-com/task-manager-mcp.git
cd task-manager-mcp
npm install
cp .env.example .env   # set MOODLR_API_URL and MOODLR_API_KEY
npm run dev            # tsx src/index.ts — stdio loop
```

To test with a local MCP client without publishing:

```json
{
  "mcpServers": {
    "moodlr-dev": {
      "command": "node",
      "args": ["/abs/path/task-manager-mcp/dist/index.js"],
      "env": { "MOODLR_API_URL": "http://localhost:3000", "MOODLR_API_KEY": "moodlr_..." }
    }
  }
}
```

## License

MIT
