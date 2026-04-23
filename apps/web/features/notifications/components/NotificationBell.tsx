"use client";

import Link from "next/link";
import { Bell, Check, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  useNotifications,
  useUnreadCount,
  useMarkNotificationRead,
} from "@/lib/query/hooks/use-notifications";
import { useNotificationStream } from "@/lib/hooks/use-notification-stream";
import type { Notification } from "@/lib/api/notifications";
import { cn } from "@/lib/utils";

function formatRelativeTime(date: string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = Math.floor((now - then) / 1000);

  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86_400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604_800) return `${Math.floor(diff / 86_400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function getNotificationTitle(n: Notification): string {
  const data = n.data as Record<string, string | undefined>;
  switch (n.template) {
    case "welcome":
      return "Welcome to AI Interview";
    case "invitation":
      return `New interview: ${data.templateTitle ?? "Untitled"}`;
    case "invitation_reminder":
      return "Interview deadline approaching";
    case "interview_started":
      return `Candidate started: ${data.candidateName ?? "Unknown"}`;
    case "interview_completed":
      return `Candidate completed: ${data.candidateName ?? "Unknown"}`;
    case "analysis_ready":
      return `AI analysis ready: ${data.candidateName ?? "Candidate"}`;
    case "analysis_failed":
      return "AI analysis failed";
    case "candidate_approved":
      return "You have been approved";
    case "candidate_rejected":
      return "Interview decision received";
    case "payment_confirmed":
      return "Payment successful";
    case "payment_failed":
      return "Payment failed";
    case "quota_exceeded":
      return "Quota exceeded";
    case "weekly_digest":
      return "Your weekly interview digest";
    default:
      return n.template.replace(/_/g, " ");
  }
}

function NotificationItem({ notification }: { notification: Notification }) {
  const markRead = useMarkNotificationRead();
  const isUnread =
    notification.status === "sent" || notification.status === "queued";

  return (
    <button
      onClick={() => isUnread && markRead.mutate(notification.id)}
      className={cn(
        "w-full text-left px-3 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer",
        isUnread && "bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm truncate",
              isUnread
                ? "font-medium text-foreground"
                : "text-muted-foreground",
            )}
          >
            {getNotificationTitle(notification)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {formatRelativeTime(notification.createdAt)}
          </p>
        </div>
        {isUnread && (
          <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1.5" />
        )}
      </div>
    </button>
  );
}

export function NotificationBell() {
  // Subscribe to real-time notifications via SSE
  useNotificationStream();

  const { data: unreadData } = useUnreadCount();
  const { data: listData, isPending } = useNotifications(10, 0);
  const unreadCount = unreadData?.count ?? 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
          className="relative h-9 w-9 p-0"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0" sideOffset={8}>
        <div className="flex items-center justify-between px-3 py-2.5 border-b">
          <p className="text-sm font-semibold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {isPending ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : !listData?.items.length ? (
            <div className="text-center py-8 px-4">
              <Check className="mx-auto mb-2 h-6 w-6 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                You're all caught up
              </p>
            </div>
          ) : (
            <div>
              {listData.items.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </div>

        {listData && listData.items.length > 0 && (
          <div className="border-t px-3 py-2">
            <Link
              href="/profile/notifications"
              className="block text-center text-xs text-primary hover:underline"
            >
              Notification settings
            </Link>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
