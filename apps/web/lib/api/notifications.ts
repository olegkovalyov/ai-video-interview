/**
 * Notifications API Client
 * Methods for notifications and preferences via API Gateway
 */

import { apiGet, apiPost, apiPut } from "@/lib/api";

// ========================================
// TYPES
// ========================================

export type NotificationChannel = "email" | "in_app" | "webhook";
export type NotificationStatus =
  | "pending"
  | "queued"
  | "sent"
  | "failed"
  | "bounced";

export interface Notification {
  id: string;
  recipientId: string;
  recipientEmail: string;
  channel: NotificationChannel;
  template: string;
  status: NotificationStatus;
  data: Record<string, unknown>;
  sentAt: string | null;
  error: string | null;
  retryCount: number;
  createdAt: string;
}

export interface NotificationListResponse {
  items: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  subscriptions: Record<string, boolean>;
  updatedAt: string;
}

export interface UpdatePreferencesDto {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  subscriptions?: Record<string, boolean>;
}

// ========================================
// NOTIFICATIONS
// ========================================

/**
 * List my notifications (paginated)
 * GET /api/notifications
 */
export async function listNotifications(
  limit = 20,
  offset = 0,
): Promise<NotificationListResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  return apiGet<NotificationListResponse>(`/api/notifications?${params}`);
}

/**
 * Get unread count
 * GET /api/notifications/unread-count
 */
export async function getUnreadCount(): Promise<{ count: number }> {
  return apiGet<{ count: number }>("/api/notifications/unread-count");
}

/**
 * Mark notification as read
 * POST /api/notifications/:id/read
 */
export async function markNotificationRead(
  id: string,
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(`/api/notifications/${id}/read`, {});
}

// ========================================
// PREFERENCES
// ========================================

/**
 * Get my notification preferences
 * GET /api/notification-preferences
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiGet<NotificationPreferences>("/api/notification-preferences");
}

/**
 * Update my notification preferences
 * PUT /api/notification-preferences
 */
export async function updateNotificationPreferences(
  dto: UpdatePreferencesDto,
): Promise<{ success: boolean }> {
  return apiPut<{ success: boolean }>("/api/notification-preferences", dto);
}
