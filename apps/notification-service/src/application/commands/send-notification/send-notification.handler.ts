import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { SendNotificationCommand } from "./send-notification.command";
import { Notification } from "../../../domain/aggregates/notification.aggregate";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";
import type { INotificationPreferenceRepository } from "../../../domain/repositories/notification-preference.repository.interface";
import type { IEmailService } from "../../interfaces/email-service.interface";
import type { IOutboxService } from "../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../interfaces/unit-of-work.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";
import { TEMPLATE_SUBJECTS } from "../../../config/templates.config";

@CommandHandler(SendNotificationCommand)
export class SendNotificationHandler
  implements ICommandHandler<SendNotificationCommand>
{
  constructor(
    @Inject("INotificationRepository")
    private readonly notificationRepo: INotificationRepository,
    @Inject("INotificationPreferenceRepository")
    private readonly preferenceRepo: INotificationPreferenceRepository,
    @Inject("IEmailService")
    private readonly emailService: IEmailService,
    @Inject("IOutboxService")
    private readonly outboxService: IOutboxService,
    @Inject("IUnitOfWork")
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: SendNotificationCommand): Promise<string> {
    const { recipientId, recipientEmail, channel, template, data } = command;

    // Check user preferences
    const preferences = await this.preferenceRepo.findByUserId(recipientId);
    if (preferences) {
      if (channel === "email" && !preferences.emailEnabled) {
        this.logger.info("Email notifications disabled for user", {
          action: "send_notification.skip",
          userId: recipientId,
        });
        return "";
      }
      if (channel === "in_app" && !preferences.inAppEnabled) {
        this.logger.info("In-app notifications disabled for user", {
          action: "send_notification.skip",
          userId: recipientId,
        });
        return "";
      }
      if (!preferences.isSubscribed(template)) {
        this.logger.info(`User unsubscribed from ${template}`, {
          action: "send_notification.skip",
          userId: recipientId,
        });
        return "";
      }
    }

    const notificationId = uuid();

    const notification = Notification.create({
      id: notificationId,
      recipientId,
      recipientEmail,
      channel,
      template,
      data,
    });

    // Route to correct channel
    if (channel === "email") {
      await this.sendEmail(notification);
    } else if (channel === "in_app") {
      await this.sendInApp(notification);
    }

    // Save notification + outbox event in transaction
    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.notificationRepo.save(notification, tx);
      return this.outboxService.saveEvent(
        notification.status === "sent"
          ? "notification.sent"
          : "notification.failed",
        {
          notificationId: notification.id,
          recipientId: notification.recipientId,
          channel: notification.channel,
          template: notification.template,
          status: notification.status,
        },
        notification.id,
        tx,
      );
    });

    await this.outboxService.schedulePublishing([eventId]);

    this.logger.commandLog("SendNotification", notification.status === "sent", {
      action: "send_notification",
      notificationId,
      channel,
      template,
      userId: recipientId,
    });

    return notificationId;
  }

  private async sendEmail(notification: Notification): Promise<void> {
    const subject =
      TEMPLATE_SUBJECTS[notification.template] || "AI Interview Notification";

    try {
      notification.markQueued();
      await this.emailService.send(
        notification.template,
        notification.recipientEmail,
        subject,
        notification.data,
      );
      notification.markSent();
    } catch (error) {
      notification.markFailed(error.message);
      this.logger.error("Failed to send email", error, {
        action: "send_notification.email_failed",
        notificationId: notification.id,
      });
    }
  }

  private async sendInApp(notification: Notification): Promise<void> {
    // In-app notifications are just saved to DB
    // The realtime service will push via Redis pub/sub
    notification.markSent();
  }
}
