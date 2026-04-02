import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { MarkNotificationReadCommand } from "./mark-notification-read.command";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";
import { NotificationNotFoundException } from "../../../domain/exceptions/notification.exceptions";
import { LoggerService } from "../../../infrastructure/logger/logger.service";

@CommandHandler(MarkNotificationReadCommand)
export class MarkNotificationReadHandler
  implements ICommandHandler<MarkNotificationReadCommand>
{
  constructor(
    @Inject("INotificationRepository")
    private readonly notificationRepo: INotificationRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const { notificationId, userId } = command;

    const notification = await this.notificationRepo.findById(notificationId);

    if (!notification) {
      throw new NotificationNotFoundException(notificationId);
    }

    if (notification.recipientId !== userId) {
      throw new NotificationNotFoundException(notificationId);
    }

    // Mark as sent (read) if still pending/queued for in-app
    if (notification.status === "sent") {
      // Already marked as read (sent state for in-app = delivered)
      return;
    }

    notification.markSent();
    await this.notificationRepo.save(notification);

    this.logger.commandLog("MarkNotificationRead", true, {
      action: "mark_notification_read",
      notificationId,
      userId,
    });
  }
}
