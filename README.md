# @moodlr/task-manager-mcp

MCP server para o [Moodlr Task Manager](https://github.com/moodlr-com/task-manager).
Permite ler, criar, editar e mover tarefas via qualquer cliente compatível com
MCP (Claude Desktop, Claude Code, outros).

## Pre-requisitos

- Node.js 20+
- Uma API key gerada no Task Manager (token comeca com `moodlr_`)

## Gerar uma API key

1. Entre no dashboard do Task Manager.
2. Abra o devtools do navegador e rode:
   ```js
   fetch('/api/profile/api-keys', {
     method: 'POST',
     headers: { 'content-type': 'application/json' },
     body: JSON.stringify({ label: 'mcp-cli' })
   }).then(r => r.json()).then(console.log)
   ```
3. Copie o campo `key` da resposta. **Ele nao aparece mais depois.**
4. Para revogar: `DELETE /api/profile/api-keys/<id>`.

> Uma pagina de settings para gerenciar chaves via UI esta no roadmap.

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

### Leitura
- `list_workspaces` — workspaces acessiveis ao caller
- `list_boards({ workspaceId? })` — boards, opcionalmente filtrados por workspace
- `list_statuses({ boardId })` — colunas de status do board (use os ids para mover tasks)
- `list_tasks({ boardId?, statusId?, priority?, assigneeIds?, tagIds?, search? })`
- `list_workspace_members({ workspaceId })`
- `list_board_members({ boardId })`

### Escrita
- `create_task({ boardId, title, description?, statusId?, groupId?, priority?, assigneeIds?, tagIds?, startDate?, dueDate? })`
- `update_task({ taskId, ...fields })` — patch parcial
- `move_task({ taskId, statusId })` — atalho para mover entre colunas (statusId=null = Backlog)
- `delete_task({ taskId })` — requer admin

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
