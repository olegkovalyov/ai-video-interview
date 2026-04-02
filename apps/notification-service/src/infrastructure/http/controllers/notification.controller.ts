import { Controller, Get, Post, Param, Query, Headers } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { ListNotificationsQuery } from "../../../application/queries/list-notifications/list-notifications.query";
import { GetUnreadCountQuery } from "../../../application/queries/get-unread-count/get-unread-count.query";
import { MarkNotificationReadCommand } from "../../../application/commands/mark-notification-read/mark-notification-read.command";

@ApiTags("notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Get()
  @ApiOperation({ summary: "List notifications for user" })
  @ApiResponse({ status: 200, description: "Notifications list" })
  async listNotifications(
    @Headers("x-user-id") userId: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string,
  ) {
    return this.queryBus.execute(
      new ListNotificationsQuery(
        userId,
        limit ? parseInt(limit, 10) : 20,
        offset ? parseInt(offset, 10) : 0,
      ),
    );
  }

  @Get("unread-count")
  @ApiOperation({ summary: "Get unread notification count" })
  @ApiResponse({ status: 200, description: "Unread count" })
  async getUnreadCount(@Headers("x-user-id") userId: string) {
    return this.queryBus.execute(new GetUnreadCountQuery(userId));
  }

  @Post(":id/read")
  @ApiOperation({ summary: "Mark notification as read" })
  @ApiResponse({ status: 200, description: "Notification marked as read" })
  async markRead(
    @Param("id") notificationId: string,
    @Headers("x-user-id") userId: string,
  ) {
    await this.commandBus.execute(
      new MarkNotificationReadCommand(notificationId, userId),
    );
    return { success: true };
  }
}
