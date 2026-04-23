import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
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
  PreferencesResponseDto,
  UpdatePreferencesDto,
} from '../dto/notification.dto';

/**
 * Notification Preferences Controller — proxies to notification-service
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/notification-preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly notificationClient: NotificationServiceClient) {}

  @Get()
  @ApiOperation({ summary: 'Get my notification preferences' })
  @ApiResponse({ status: 200, type: PreferencesResponseDto })
  async get(@CurrentUser() user: CurrentUserData) {
    return this.notificationClient.getPreferences(user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update my notification preferences' })
  @ApiResponse({ status: 200 })
  async update(
    @Body() dto: UpdatePreferencesDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.notificationClient.updatePreferences(user.userId, dto);
  }
}
