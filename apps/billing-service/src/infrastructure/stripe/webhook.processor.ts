import { Process, Processor } from "@nestjs/bull";
import { Job } from "bull";
import { CommandBus } from "@nestjs/cqrs";
import { ProcessStripeWebhookCommand } from "../../application/commands/process-stripe-webhook/process-stripe-webhook.command";
import { LoggerService } from "../logger/logger.service";

@Processor("stripe-webhooks")
export class WebhookProcessor {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
  ) {}

  @Process("process-webhook")
  async handleWebhook(
    job: Job<{
      eventId: string;
      eventType: string;
      rawBody: string;
      signature: string;
    }>,
  ): Promise<void> {
    const { eventId, eventType, rawBody, signature } = job.data;

    this.logger.info(`Processing Stripe webhook: ${eventType} (${eventId})`, {
      action: "webhook.processing",
      eventId,
      eventType,
    });

    try {
      await this.commandBus.execute(
        new ProcessStripeWebhookCommand(rawBody, signature),
      );

      this.logger.info(`Stripe webhook processed: ${eventType} (${eventId})`, {
        action: "webhook.processed",
        eventId,
        eventType,
      });
    } catch (error) {
      this.logger.error(
        `Stripe webhook processing failed: ${eventType} (${eventId}): ${error.message}`,
        error.stack,
      );
      throw error; // BullMQ will retry with exponential backoff
    }
  }
}
