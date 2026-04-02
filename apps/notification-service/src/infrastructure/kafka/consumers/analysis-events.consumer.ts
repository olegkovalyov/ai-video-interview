import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { KafkaService, KAFKA_TOPICS } from "@repo/shared";
import { LoggerService } from "../../logger/logger.service";
import { SendNotificationCommand } from "../../../application/commands/send-notification/send-notification.command";

@Injectable()
export class AnalysisEventsConsumer implements OnModuleInit {
  constructor(
    @Inject("KAFKA_SERVICE")
    private readonly kafkaService: KafkaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaService.subscribe(
        KAFKA_TOPICS.ANALYSIS_EVENTS,
        "notification-service-analysis",
        async (message) => {
          const event = this.kafkaService.parseEvent(message);
          if (!event) return;

          const eventType = (event as any).eventType;

          switch (eventType) {
            case "analysis.completed":
              await this.handleAnalysisCompleted(event as any);
              break;
            case "analysis.failed":
              await this.handleAnalysisFailed(event as any);
              break;
            default:
              break;
          }
        },
      );
      this.logger.info("Subscribed to analysis-events", {
        action: "kafka.subscribe",
      });
    } catch (error) {
      this.logger.error("Failed to subscribe to analysis-events", error);
    }
  }

  private async handleAnalysisCompleted(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.hrEmail) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.hrUserId,
          payload.hrEmail,
          "email",
          "analysis_ready",
          {
            candidateName: payload.candidateName || "Candidate",
            score: payload.overallScore || payload.score || 0,
            recommendation: payload.recommendation || "N/A",
            link: payload.reportLink || "",
          },
        ),
      );
    } catch (error) {
      this.logger.error("Failed to send analysis ready notification", error, {
        action: "analysis_events.completed_notification_failed",
      });
    }
  }

  private async handleAnalysisFailed(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.hrEmail) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.hrUserId,
          payload.hrEmail,
          "email",
          "analysis_failed",
          {
            candidateName: payload.candidateName || "Candidate",
            error: payload.error || "Unknown error",
            retryLink: payload.retryLink || "",
          },
        ),
      );
    } catch (error) {
      this.logger.error("Failed to send analysis failed notification", error, {
        action: "analysis_events.failed_notification_failed",
      });
    }
  }
}
