import type { ChannelType } from "../../domain/value-objects/channel.vo";
import type { NotificationStatusType } from "../../domain/value-objects/notification-status.vo";
import type { NotificationTemplateType } from "../../domain/value-objects/notification-template.vo";
import type { WebhookStatusType } from "../../domain/aggregates/webhook-endpoint.aggregate";

export interface NotificationResponseDto {
  id: string;
  recipientId: string;
  recipientEmail: string;
  channel: ChannelType;
  template: NotificationTemplateType;
  status: NotificationStatusType;
  data: Record<string, unknown>;
  sentAt: string | null;
  error: string | null;
  retryCount: number;
  createdAt: string;
}

export interface NotificationPreferenceResponseDto {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  subscriptions: Record<string, boolean>;
  updatedAt: string;
}

export interface WebhookEndpointResponseDto {
  id: string;
  companyId: string;
  url: string;
  events: string[];
  status: WebhookStatusType;
  failureCount: number;
  lastDeliveryAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponseDto {
  count: number;
}
