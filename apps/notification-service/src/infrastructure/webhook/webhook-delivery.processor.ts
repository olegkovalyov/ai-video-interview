import { Processor, Process } from "@nestjs/bull";
import type { Job } from "bull";
import { Injectable } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { BULL_QUEUE, BULL_JOB, WEBHOOK_CONFIG } from "../constants";
import { ProcessWebhookDeliveryCommand } from "../../application/commands/process-webhook-delivery/process-webhook-delivery.command";
import { LoggerService } from "../logger/logger.service";
import { MetricsService } from "../metrics/metrics.service";

@Processor(BULL_QUEUE.WEBHOOK_DELIVERY)
@Injectable()
export class WebhookDeliveryProcessor {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
  ) {}

  @Process({
    name: BULL_JOB.DELIVER_WEBHOOK,
    concurrency: WEBHOOK_CONFIG.CONCURRENCY,
  })
  async deliverWebhook(job: Job): Promise<void> {
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
