import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { BULL_QUEUE, WEBHOOK_CONFIG } from "../constants";
import { ProcessWebhookDeliveryCommand } from "../../application/commands/process-webhook-delivery/process-webhook-delivery.command";
import { LoggerService } from "../logger/logger.service";
import { MetricsService } from "../metrics/metrics.service";

@Processor(BULL_QUEUE.WEBHOOK_DELIVERY, {
  concurrency: WEBHOOK_CONFIG.CONCURRENCY,
})
@Injectable()
export class WebhookDeliveryProcessor extends WorkerHost {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { webhookEndpointId, eventType, payload } = job.data;

    this.logger.info("Processing webhook delivery", {
      action: "webhook.process",
      webhookEndpointId,
      eventType,
    });

    try {
      await this.commandBus.execute(
        new ProcessWebhookDeliveryCommand(
          webhookEndpointId,
          eventType,
          payload,
        ),
      );
      this.metricsService.recordWebhookDelivered(eventType);
    } catch (error) {
      this.metricsService.recordWebhookFailed(eventType);
      this.logger.error("Webhook delivery failed", error, {
        action: "webhook.delivery_failed",
        webhookEndpointId,
        eventType,
      });
      throw error;
    }
  }
}
