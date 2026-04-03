import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetUnreadCountQuery } from "./get-unread-count.query";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";
import type { UnreadCountResponseDto } from "../../dto/notification.response.dto";

@QueryHandler(GetUnreadCountQuery)
export class GetUnreadCountHandler
  implements IQueryHandler<GetUnreadCountQuery>
{
  constructor(
    @Inject("INotificationRepository")
    private readonly notificationRepo: INotificationRepository,
  ) {}

  async execute(query: GetUnreadCountQuery): Promise<UnreadCountResponseDto> {
    const count = await this.notificationRepo.countUnread(query.recipientId);
    return { count };
  }
}
