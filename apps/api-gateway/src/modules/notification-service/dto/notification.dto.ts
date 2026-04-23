import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsObject,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ description: 'Max items per page', default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Skip N items', default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Enable email notifications' })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: 'Enable in-app notifications' })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Per-template subscription map',
    example: { invitation: true, analysis_ready: true, weekly_digest: false },
  })
  @IsOptional()
  @IsObject()
  subscriptions?: Record<string, boolean>;
}

export class NotificationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  recipientId: string;

  @ApiProperty()
  recipientEmail: string;

  @ApiProperty({ enum: ['email', 'in_app', 'webhook'] })
  channel: string;

  @ApiProperty()
  template: string;

  @ApiProperty({ enum: ['pending', 'queued', 'sent', 'failed', 'bounced'] })
  status: string;

  @ApiProperty({ type: Object })
  data: Record<string, unknown>;

  @ApiProperty({ nullable: true })
  sentAt: string | null;

  @ApiProperty({ nullable: true })
  error: string | null;

  @ApiProperty()
  retryCount: number;

  @ApiProperty()
  createdAt: string;
}

export class NotificationListResponseDto {
  @ApiProperty({ type: [NotificationResponseDto] })
  items: NotificationResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;
}

export class UnreadCountResponseDto {
  @ApiProperty()
  count: number;
}

export class PreferencesResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  emailEnabled: boolean;

  @ApiProperty()
  inAppEnabled: boolean;

  @ApiProperty({ type: Object })
  subscriptions: Record<string, boolean>;

  @ApiProperty()
  updatedAt: string;
}
