import { Notification } from "../../../domain/aggregates/notification.aggregate";
import { WebhookEndpoint } from "../../../domain/aggregates/webhook-endpoint.aggregate";
import { NotificationPreference } from "../../../domain/entities/notification-preference.entity";
import { NotificationEntity } from "../entities/notification.entity";
import { WebhookEndpointEntity } from "../entities/webhook-endpoint.entity";
import { NotificationPreferenceEntity } from "../entities/notification-preference.entity";
import type { ChannelType } from "../../../domain/value-objects/channel.vo";
import type { NotificationStatusType } from "../../../domain/value-objects/notification-status.vo";
import type { NotificationTemplateType } from "../../../domain/value-objects/notification-template.vo";
import type { WebhookStatusType } from "../../../domain/aggregates/webhook-endpoint.aggregate";

export class NotificationMapper {
  static toDomain(entity: NotificationEntity): Notification {
    return Notification.reconstitute({
      id: entity.id,
      recipientId: entity.recipientId,
      recipientEmail: entity.recipientEmail,
      channel: entity.channel as ChannelType,
      template: entity.template as NotificationTemplateType,
      status: entity.status as NotificationStatusType,
      data: entity.data,
      sentAt: entity.sentAt,
      error: entity.error,
      retryCount: entity.retryCount,
      createdAt: entity.createdAt,
    });
  }

  static toEntity(domain: Notification): NotificationEntity {
    const entity = new NotificationEntity();
    entity.id = domain.id;
    entity.recipientId = domain.recipientId;
    entity.recipientEmail = domain.recipientEmail;
    entity.channel = domain.channel;
    entity.template = domain.template;
    entity.status = domain.status;
    entity.data = domain.data;
    entity.sentAt = domain.sentAt;
    entity.error = domain.error;
    entity.retryCount = domain.retryCount;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}

export class WebhookEndpointMapper {
  static toDomain(entity: WebhookEndpointEntity): WebhookEndpoint {
    return WebhookEndpoint.reconstitute({
      id: entity.id,
      companyId: entity.companyId,
      url: entity.url,
      secret: entity.secret,
      events: entity.events,
      status: entity.status as WebhookStatusType,
      failureCount: entity.failureCount,
      lastDeliveryAt: entity.lastDeliveryAt,
      createdAt: entity.createdAt,
    });
  }

  static toEntity(domain: WebhookEndpoint): WebhookEndpointEntity {
    const entity = new WebhookEndpointEntity();
    entity.id = domain.id;
    entity.companyId = domain.companyId;
    entity.url = domain.url;
    entity.secret = domain.secret;
    entity.events = domain.events;
    entity.status = domain.status;
    entity.failureCount = domain.failureCount;
    entity.lastDeliveryAt = domain.lastDeliveryAt;
    entity.createdAt = domain.createdAt;
    return entity;
  }
}

export class NotificationPreferenceMapper {
  static toDomain(
    entity: NotificationPreferenceEntity,
  ): NotificationPreference {
    return NotificationPreference.reconstitute({
      userId: entity.userId,
      emailEnabled: entity.emailEnabled,
      inAppEnabled: entity.inAppEnabled,
      subscriptions: entity.subscriptions,
      updatedAt: entity.updatedAt,
    });
  }

  static toEntity(
    domain: NotificationPreference,
  ): NotificationPreferenceEntity {
    const entity = new NotificationPreferenceEntity();
    entity.userId = domain.userId;
    entity.emailEnabled = domain.emailEnabled;
    entity.inAppEnabled = domain.inAppEnabled;
    entity.subscriptions = domain.subscriptions;
    entity.updatedAt = domain.updatedAt;
    return entity;
  }
}
