import type { ChannelType } from "../../../domain/value-objects/channel.vo";
import type { NotificationTemplateType } from "../../../domain/value-objects/notification-template.vo";

export class SendNotificationCommand {
  constructor(
    public readonly recipientId: string,
    public readonly recipientEmail: string,
    public readonly channel: ChannelType,
    public readonly template: NotificationTemplateType,
    public readonly data: Record<string, unknown>,
  ) {}
}
