# @moodlr/task-manager-mcp

MCP server para o [Moodlr Task Manager](https://github.com/moodlr-com/task-manager).
Permite ler, criar, editar e mover tarefas via qualquer cliente compatível com
MCP (Claude Desktop, Claude Code, outros).

## Pre-requisitos

- Node.js 20+
- Uma API key gerada no Task Manager (token comeca com `moodlr_`)

## Gerar uma API key

1. Entre no dashboard do Task Manager.
2. Clique no seu avatar no header → **Credenciais**.
3. Digite um label (ex: `mcp-laptop`) e clique **Create**.
4. **Copie o token imediatamente** — nao ha como recupera-lo depois.
5. Para revogar: mesma tela, clique no icone de lixeira.

## Configuracao no Claude Desktop

Edite `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
ou `%APPDATA%/Claude/claude_desktop_config.json` (Windows):

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

Reinicie o Claude Desktop. As tools ficam disponiveis imediatamente.

## Configuracao no Claude Code

Adicione ao `.mcp.json` do projeto (ou `~/.claude.json`):

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

## Tools disponiveis

### Workspaces
- `list_workspaces` — workspaces acessiveis ao caller
- `list_workspace_members({ workspaceId })`
- `add_workspace_member({ workspaceId, userId, role? })` — role: admin | member (default member)
- `update_workspace_member_role({ workspaceId, userId, role })`
- `remove_workspace_member({ workspaceId, userId })`

### Boards
- `list_boards({ workspaceId? })`
- `list_board_members({ boardId })`
- `list_statuses({ boardId })` — sempre retorna o set canonico de 6 statuses
- `create_board({ workspaceId, name, description?, color?, icon? })`
- `update_board({ boardId, ...fields })`
- `delete_board({ boardId })`
- `add_board_member({ boardId, userId })`
- `remove_board_member({ boardId, userId })`

### Tasks
- `list_tasks({ boardId?, statusId?, priority?, assigneeIds?, tagIds?, sprintId?, search? })`
- `list_assigned_to_me()` — feed cross-board do assignee atual
- `create_task({ boardId, title, description?, statusId?, groupId?, priority?, assigneeIds?, tagIds?, sprintId?, startDate?, dueDate? })`
- `update_task({ taskId, ...fields })` — patch parcial; aceita `sprintId`
- `move_task({ taskId, statusId })` — atalho de coluna (statusId=null = Backlog)
- `delete_task({ taskId })` — requer admin
- `bulk_update_tasks({ taskIds, update })` — `update.addAssigneeIds`/`addTagIds` somam (nao substituem); `statusId`/`priority`/`sprintId`/datas sobrescrevem
- `bulk_delete_tasks({ taskIds })`

### Checklist (subtasks)
- `list_checklist({ taskId })`
- `add_checklist_item({ taskId, title })`
- `toggle_checklist_item({ taskId, itemId, isDone? })` — sem `isDone` faz toggle
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
- `start_sprint({ sprintId })` — planned -> active
- `complete_sprint({ sprintId, moveIncompleteTo })` — `moveIncompleteTo`: `"backlog"` ou um sprintId planejado
- `delete_sprint({ sprintId })`

### Tags
- `list_tags({ workspaceId })`
- `create_tag({ workspaceId, name, color? })` — idempotente
- `update_tag({ tagId, name?, color? })`
- `delete_tag({ tagId })`

### Users
- `list_users({ search? })`
- `find_user_by_email({ email })`
- `whoami()`

### Notificacoes
- `list_notifications({ unreadOnly? })`
- `mark_notification_read({ notificationId })`
- `mark_all_notifications_read()`
- `delete_notification({ notificationId })`

## Desenvolvimento

```bash
git clone https://github.com/moodlr-com/task-manager-mcp.git
cd task-manager-mcp
npm install
cp .env.example .env   # set MOODLR_API_URL and MOODLR_API_KEY
npm run dev            # tsx src/index.ts — stdio loop
```

Para testar com um cliente MCP local sem publicar:

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

## Licenca

MIT
