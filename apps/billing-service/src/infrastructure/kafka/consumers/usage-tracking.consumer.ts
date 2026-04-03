import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { KafkaService, KAFKA_TOPICS } from "@repo/shared";
import { LoggerService } from "../../logger/logger.service";
import { IncrementUsageCommand } from "../../../application/commands/increment-usage/increment-usage.command";

/**
 * Usage Tracking Consumer
 * Listens to interview-events and analysis-events to track usage.
 * Increments interview and analysis token counters.
 */
@Injectable()
export class UsageTrackingConsumer implements OnModuleInit {
  constructor(
    @Inject("KAFKA_SERVICE")
    private readonly kafkaService: KafkaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      // Subscribe to interview events
      // Non-blocking subscribe
      this.kafkaService.subscribe(
        KAFKA_TOPICS.INTERVIEW_EVENTS,
        "billing-service-interview",
        async (message) => {
          const event = this.kafkaService.parseEvent(message);
          if (!event) return;

          if ((event as any).eventType === "invitation.completed") {
            await this.handleInvitationCompleted(event as any);
          }
        },
      );

      // Subscribe to analysis events
      // Non-blocking subscribe
      this.kafkaService.subscribe(
        KAFKA_TOPICS.ANALYSIS_EVENTS,
        "billing-service-analysis",
        async (message) => {
          const event = this.kafkaService.parseEvent(message);
          if (!event) return;

          if ((event as any).eventType === "analysis.completed") {
            await this.handleAnalysisCompleted(event as any);
          }
        },
      );

      this.logger.info(
        "Subscribed to interview-events and analysis-events for usage tracking",
      );
    } catch (error) {
      this.logger.error("Failed to subscribe to usage tracking events", error);
    }
  }

  private async handleInvitationCompleted(event: any): Promise<void> {
    const companyId = event.payload?.companyId;
    if (!companyId) {
      this.logger.warn("invitation.completed event missing companyId");
      return;
    }

    try {
      await this.commandBus.execute(
        new IncrementUsageCommand(companyId, "interviews", 1),
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment interview usage for company ${companyId}`,
        error,
      );
    }
  }

  private async handleAnalysisCompleted(event: any): Promise<void> {
    const companyId = event.payload?.companyId;
    const tokensUsed = event.payload?.tokensUsed || 0;
    if (!companyId) {
      this.logger.warn("analysis.completed event missing companyId");
      return;
    }

    try {
      await this.commandBus.execute(
        new IncrementUsageCommand(companyId, "analysisTokens", tokensUsed),
      );
    } catch (error) {
      this.logger.error(
        `Failed to increment analysis usage for company ${companyId}`,
        error,
      );
    }
  }
}
