import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { KafkaService, KAFKA_TOPICS } from "@repo/shared";
import { LoggerService } from "../../logger/logger.service";
import { SendNotificationCommand } from "../../../application/commands/send-notification/send-notification.command";

@Injectable()
export class UserEventsConsumer implements OnModuleInit {
  constructor(
    @Inject("KAFKA_SERVICE")
    private readonly kafkaService: KafkaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaService.subscribe(
        KAFKA_TOPICS.USER_EVENTS,
        "notification-service-user",
        async (message) => {
          const event = this.kafkaService.parseEvent(message);
          if (!event) return;

          const eventType = (event as any).eventType;

          switch (eventType) {
            case "user.created":
              await this.handleUserCreated(event as any);
              break;
            case "user.role-selected":
              await this.handleRoleSelected(event as any);
              break;
            default:
              break;
          }
        },
      );
      this.logger.info("Subscribed to user-events", {
        action: "kafka.subscribe",
      });
    } catch (error) {
      this.logger.error("Failed to subscribe to user-events", error);
    }
  }

  private async handleUserCreated(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.email) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.userId || payload.id,
          payload.email,
          "email",
          "welcome",
          {
            name: payload.firstName || payload.name || "User",
            role: payload.role || "candidate",
          },
        ),
      );
    } catch (error) {
      this.logger.error("Failed to send welcome email", error, {
        action: "user_events.welcome_failed",
        userId: payload.userId || payload.id,
      });
    }
  }

  private async handleRoleSelected(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.email) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.userId || payload.id,
          payload.email,
          "in_app",
          "welcome",
          {
            name: payload.firstName || payload.name || "User",
            role: payload.role,
          },
        ),
      );
    } catch (error) {
      this.logger.error("Failed to send role confirmation", error, {
        action: "user_events.role_confirmation_failed",
      });
    }
  }
}
