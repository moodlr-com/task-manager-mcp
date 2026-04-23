import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient } from "../client.js";
import { toError, toJson } from "./util.js";

interface NotificationsResponse {
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    taskId: string | null;
    createdAt: string;
  }>;
  unreadCount: number;
}

export function registerNotificationTools(server: McpServer, api: ApiClient) {
  server.registerTool(
    "list_notifications",
    {
      title: "List notifications",
      description:
        "Return the caller's in-app notifications (up to 50 most recent) plus an unread count. Pass unreadOnly=true to filter client-side to items where isRead=false.",
      inputSchema: {
        unreadOnly: z
          .boolean()
          .optional()
          .describe("Return only unread notifications (default: false)"),
      },
      annotations: { readOnlyHint: true, idempotentHint: true },
    },
    async ({ unreadOnly }) => {
      try {
        const data = await api.get<NotificationsResponse>(
          "/api/notifications",
        );
        const notifications = unreadOnly
          ? data.notifications.filter((n) => !n.isRead)
          : data.notifications;
        return toJson({
          notifications,
          unreadCount: data.unreadCount,
        });
      } catch (err) {
        return toError("list_notifications", err);
      }
    },
  );

  server.registerTool(
    "mark_notification_read",
    {
      title: "Mark a notification as read",
      description:
        "Flip isRead to true for a single notification. Use mark_all_notifications_read to mark the whole feed.",
      inputSchema: {
        notificationId: z.string().describe("Notification UUID"),
      },
    },
    async ({ notificationId }) => {
      try {
        const result = await api.patch<unknown>(
          `/api/notifications/${notificationId}`,
        );
        return toJson(result);
      } catch (err) {
        return toError("mark_notification_read", err);
      }
    },
  );

  server.registerTool(
    "mark_all_notifications_read",
    {
      title: "Mark every notification as read",
      description:
        "Flip isRead to true for every unread notification in the caller's feed.",
      inputSchema: {},
    },
    async () => {
      try {
        const result = await api.patch<unknown>("/api/notifications");
        return toJson(result);
      } catch (err) {
        return toError("mark_all_notifications_read", err);
      }
    },
  );

  server.registerTool(
    "delete_notification",
    {
      title: "Delete a notification",
      description:
        "Permanently remove a single notification from the caller's feed.",
      inputSchema: {
        notificationId: z.string().describe("Notification UUID"),
      },
      annotations: { destructiveHint: true },
    },
    async ({ notificationId }) => {
      try {
        const result = await api.delete<unknown>(
          `/api/notifications/${notificationId}`,
        );
        return toJson(result);
      } catch (err) {
        return toError("delete_notification", err);
      }
    },
  );
}
