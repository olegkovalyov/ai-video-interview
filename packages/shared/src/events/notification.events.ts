/**
 * Notification Service Integration Events
 * Published to notification-events Kafka topic via Outbox pattern.
 */

export interface NotificationBaseEvent {
  eventId: string;
  eventType: string;
  timestamp: number;
  version: string;
  source: "notification-service";
}

export interface NotificationSentIntegrationEvent
  extends NotificationBaseEvent {
  eventType: "notification.sent";
  payload: {
    notificationId: string;
    recipientId: string;
    channel: string;
    template: string;
    status: string;
  };
}

export interface NotificationFailedIntegrationEvent
  extends NotificationBaseEvent {
  eventType: "notification.failed";
  payload: {
    notificationId: string;
    recipientId: string;
    channel: string;
    template: string;
    status: string;
    error?: string;
  };
}

export type NotificationEvent =
  | NotificationSentIntegrationEvent
  | NotificationFailedIntegrationEvent;
