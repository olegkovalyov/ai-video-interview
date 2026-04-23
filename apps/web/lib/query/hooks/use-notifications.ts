import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "../query-keys";
import {
  getNotificationPreferences,
  getUnreadCount,
  listNotifications,
  markNotificationRead,
  updateNotificationPreferences,
  type UpdatePreferencesDto,
} from "@/lib/api/notifications";

/**
 * List my notifications (paginated)
 */
export function useNotifications(limit = 20, offset = 0) {
  return useQuery({
    queryKey: notificationKeys.list(limit, offset),
    queryFn: () => listNotifications(limit, offset),
    staleTime: 30_000,
  });
}

/**
 * Get unread notification count — polls every 30s while mounted
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 10_000,
  });
}

/**
 * Mark a notification as read — invalidates list and unread count
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

/**
 * Get notification preferences
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: getNotificationPreferences,
    staleTime: 5 * 60_000,
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: UpdatePreferencesDto) =>
      updateNotificationPreferences(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.preferences(),
      });
    },
  });
}
