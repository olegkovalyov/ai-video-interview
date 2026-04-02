import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListNotificationsQuery } from "./list-notifications.query";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";
import type { NotificationResponseDto } from "../../dto/notification.response.dto";

@QueryHandler(ListNotificationsQuery)
export class ListNotificationsHandler
  implements IQueryHandler<ListNotificationsQuery>
{
  constructor(
    @Inject("INotificationRepository")
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(
    query: ListNotificationsQuery,
  ): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationRepo.findByRecipientId(
      query.recipientId,
      { limit: query.limit, offset: query.offset },
    );

    return notifications.map((n) => ({
      id: n.id,
      recipientId: n.recipientId,
      recipientEmail: n.recipientEmail,
      channel: n.channel,
      template: n.template,
      status: n.status,
      data: n.data,
      sentAt: n.sentAt?.toISOString() || null,
      error: n.error,
      retryCount: n.retryCount,
      createdAt: n.createdAt.toISOString(),
    }));
  }
}
