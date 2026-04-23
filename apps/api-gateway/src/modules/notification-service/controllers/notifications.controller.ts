import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { NotificationServiceClient } from '../clients/notification-service.client';
import {
  ListNotificationsQueryDto,
  NotificationListResponseDto,
  UnreadCountResponseDto,
} from '../dto/notification.dto';

/**
 * Notifications Controller — proxies to notification-service
 * All endpoints require JWT auth; user identity forwarded via x-user-id header.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationClient: NotificationServiceClient) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications (paginated)' })
  @ApiResponse({ status: 200, type: NotificationListResponseDto })
  async list(
    @Query() query: ListNotificationsQueryDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.notificationClient.listNotifications(
      user.userId,
      query.limit ?? 20,
      query.offset ?? 0,
    );
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get count of unread notifications' })
  @ApiResponse({ status: 200, type: UnreadCountResponseDto })
  async unreadCount(@CurrentUser() user: CurrentUserData) {
    return this.notificationClient.getUnreadCount(user.userId);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200 })
  async markRead(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.notificationClient.markNotificationRead(id, user.userId);
  }
}
