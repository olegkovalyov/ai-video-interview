import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { KafkaService, KAFKA_TOPICS } from "@repo/shared";
import { LoggerService } from "../../logger/logger.service";
import { CreateFreeSubscriptionCommand } from "../../../application/commands/create-free-subscription/create-free-subscription.command";

/**
 * User Created Consumer
 * Listens to user-events for user.created events.
 * Creates a free subscription for each new HR company.
 */
@Injectable()
export class UserCreatedConsumer implements OnModuleInit {
  constructor(
    @Inject("KAFKA_SERVICE")
    private readonly kafkaService: KafkaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      // Non-blocking subscribe
      this.kafkaService.subscribe(
        KAFKA_TOPICS.USER_EVENTS,
        "billing-service-user",
        async (message) => {
          const event = this.kafkaService.parseEvent(message);
          if (!event) return;

          if ((event as any).eventType === "user.created") {
            await this.handleUserCreated(event as any);
          }
        },
      );
      this.logger.info("Subscribed to user-events for user.created");
    } catch (error) {
      this.logger.error("Failed to subscribe to user-events", error);
    }
  }

  private async handleUserCreated(event: any): Promise<void> {
    const { payload } = event;

    // Only create subscription for HR users (they represent companies)
    if (payload?.role !== "hr" && payload?.roles?.includes?.("hr") !== true) {
      return;
    }

    const companyId = payload?.companyId;
    if (!companyId) {
      this.logger.warn("user.created event missing companyId, skipping");
      return;
    }

    try {
      await this.commandBus.execute(
        new CreateFreeSubscriptionCommand(companyId),
      );
      this.logger.info(`Free subscription created for company ${companyId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create free subscription for company ${companyId}`,
        error,
      );
    }
  }
}
