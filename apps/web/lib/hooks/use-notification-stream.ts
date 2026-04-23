"use client";

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { notificationKeys } from "@/lib/query/query-keys";
import { invitationKeys } from "@/lib/query/query-keys";
import { analysisKeys } from "@/lib/query/query-keys";
import { logger } from "@/lib/logger";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

/**
 * Subscribe to real-time notifications via Server-Sent Events.
 * Automatically invalidates related React Query caches when events arrive.
 *
 * Reconnection is handled by the browser (EventSource auto-reconnects).
 */
export function useNotificationStream(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const eventSource = new EventSource(`${API_URL}/api/notifications/stream`, {
      withCredentials: true,
    });

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data) as {
          type?: string;
          template?: string;
          data?: Record<string, unknown>;
        };

        // Always invalidate notifications list + unread count
        queryClient.invalidateQueries({ queryKey: notificationKeys.all });

        // Smart invalidation based on event type
        switch (payload.template) {
          case "invitation":
          case "invitation_reminder":
            queryClient.invalidateQueries({
              queryKey: invitationKeys.candidate(),
            });
            break;
          case "interview_started":
          case "interview_completed":
            queryClient.invalidateQueries({ queryKey: invitationKeys.hr() });
            break;
          case "analysis_ready":
          case "analysis_failed":
            queryClient.invalidateQueries({ queryKey: invitationKeys.hr() });
            queryClient.invalidateQueries({ queryKey: analysisKeys.all });
            break;
          case "candidate_approved":
          case "candidate_rejected":
            queryClient.invalidateQueries({
              queryKey: invitationKeys.candidate(),
            });
            break;
        }
      } catch (error) {
        logger.error("Failed to parse SSE message", error);
      }
    };

    eventSource.onerror = (error) => {
      logger.debug("SSE connection error (will auto-reconnect)", error);
    };

    return () => {
      eventSource.close();
    };
  }, [enabled, queryClient]);
}
