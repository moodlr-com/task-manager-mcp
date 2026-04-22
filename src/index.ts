#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { apiClientFromEnv } from "./client.js";
import { createServer } from "./server.js";

async function main() {
  // Never write to stdout — stdio transport uses it for JSON-RPC framing.
  // Startup diagnostics and errors go to stderr.
  let api;
  try {
    api = apiClientFromEnv();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`moodlr-task-manager-mcp: ${msg}`);
    process.exit(1);
  }

  const server = createServer(api);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("moodlr-task-manager-mcp: ready on stdio");
}

main().catch((err) => {
  console.error("moodlr-task-manager-mcp: fatal", err);
  process.exit(1);
});
