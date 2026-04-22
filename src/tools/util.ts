import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ApiError } from "../client.js";

/** Format a value as a JSON text content block for MCP. */
export function toJson(value: unknown): CallToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value, null, 2) }],
  };
}

/**
 * Wrap an error into the MCP error content shape so the caller sees the
 * upstream message rather than a generic failure. ApiError carries the
 * server's JSON `error` field when present.
 */
export function toError(tool: string, err: unknown): CallToolResult {
  if (err instanceof ApiError) {
    return {
      content: [
        {
          type: "text",
          text: `${tool} failed: ${err.message} (HTTP ${err.status})`,
        },
      ],
      isError: true,
    };
  }

  const message = err instanceof Error ? err.message : String(err);
  return {
    content: [{ type: "text", text: `${tool} failed: ${message}` }],
    isError: true,
  };
}
