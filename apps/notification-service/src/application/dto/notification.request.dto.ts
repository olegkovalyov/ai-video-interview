import {
  IsString,
  IsEmail,
  IsEnum,
  IsObject,
  IsOptional,
  IsBoolean,
  IsArray,
  IsUrl,
  IsUUID,
  IsNumber,
  Min,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  CHANNELS,
  type ChannelType,
} from "../../domain/value-objects/channel.vo";
import {
  NOTIFICATION_TEMPLATES,
  type NotificationTemplateType,
} from "../../domain/value-objects/notification-template.vo";

export class SendNotificationDto {
  @ApiProperty({ description: "Recipient user ID" })
  @IsUUID()
  recipientId: string;

  @ApiProperty({ description: "Recipient email address" })
  @IsEmail()
  recipientEmail: string;

  @ApiProperty({ enum: CHANNELS, description: "Notification channel" })
  @IsEnum(CHANNELS)
  channel: ChannelType;

  @ApiProperty({
    enum: NOTIFICATION_TEMPLATES,
    description: "Template name",
  })
  @IsEnum(NOTIFICATION_TEMPLATES)
  template: NotificationTemplateType;

  @ApiProperty({ description: "Template data variables" })
  @IsObject()
  data: Record<string, unknown>;
}

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: "Enable/disable email notifications" })
  @IsOptional()
  @IsBoolean()
  emailEnabled?: boolean;

  @ApiPropertyOptional({ description: "Enable/disable in-app notifications" })
  @IsOptional()
  @IsBoolean()
  inAppEnabled?: boolean;

  @ApiPropertyOptional({
    description: "Subscription preferences per notification type",
  })
  @IsOptional()
  @IsObject()
  subscriptions?: Record<string, boolean>;
}

export class RegisterWebhookDto {
  @ApiProperty({ description: "Company ID" })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: "Webhook delivery URL" })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({
    description: "Event types to subscribe to",
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  events: string[];
}

export class ListNotificationsDto {
  @ApiPropertyOptional({ description: "Page limit", default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;

  @ApiPropertyOptional({ description: "Page offset", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  offset?: number;
}
