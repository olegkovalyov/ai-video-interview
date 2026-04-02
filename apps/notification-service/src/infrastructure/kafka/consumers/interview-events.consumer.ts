import { Injectable, Inject, OnModuleInit } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { KafkaService, KAFKA_TOPICS } from "@repo/shared";
import { LoggerService } from "../../logger/logger.service";
import { SendNotificationCommand } from "../../../application/commands/send-notification/send-notification.command";

@Injectable()
export class InterviewEventsConsumer implements OnModuleInit {
  constructor(
    @Inject("KAFKA_SERVICE")
    private readonly kafkaService: KafkaService,
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  async onModuleInit() {
    try {
      await this.kafkaService.subscribe(
        KAFKA_TOPICS.INTERVIEW_EVENTS,
        "notification-service-interview",
        async (message) => {
          const event = this.kafkaService.parseEvent(message);
          if (!event) return;

          const eventType = (event as any).eventType;

          switch (eventType) {
            case "invitation.created":
              await this.handleInvitationCreated(event as any);
              break;
            case "invitation.started":
              await this.handleInvitationStarted(event as any);
              break;
            case "invitation.completed":
              await this.handleInvitationCompleted(event as any);
              break;
            default:
              break;
          }
        },
      );
      this.logger.info("Subscribed to interview-events", {
        action: "kafka.subscribe",
      });
    } catch (error) {
      this.logger.error("Failed to subscribe to interview-events", error);
    }
  }

  private async handleInvitationCreated(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.candidateEmail) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.candidateId,
          payload.candidateEmail,
          "email",
          "invitation",
          {
            name: payload.candidateName || "Candidate",
            company: payload.companyName || "Company",
            templateTitle: payload.templateTitle || "Interview",
            link: payload.interviewLink || "",
            expiresAt: payload.expiresAt || "",
          },
        ),
      );
    } catch (error) {
      this.logger.error("Failed to send invitation email", error, {
        action: "interview_events.invitation_failed",
      });
    }
  }

  private async handleInvitationStarted(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.hrEmail) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.hrUserId,
          payload.hrEmail,
          "email",
          "interview_started",
          {
            candidateName: payload.candidateName || "Candidate",
            templateTitle: payload.templateTitle || "Interview",
          },
        ),
      );
    } catch (error) {
      this.logger.error(
        "Failed to send interview started notification",
        error,
        {
          action: "interview_events.started_notification_failed",
        },
      );
    }
  }

  private async handleInvitationCompleted(event: any): Promise<void> {
    const { payload } = event;
    if (!payload?.hrEmail) return;

    try {
      await this.commandBus.execute(
        new SendNotificationCommand(
          payload.hrUserId,
          payload.hrEmail,
          "email",
          "interview_completed",
          {
            candidateName: payload.candidateName || "Candidate",
            templateTitle: payload.templateTitle || "Interview",
            responseCount: payload.responseCount || 0,
          },
        ),
      );
    } catch (error) {
      this.logger.error(
        "Failed to send interview completed notification",
        error,
        {
          action: "interview_events.completed_notification_failed",
        },
      );
    }
  }
}
