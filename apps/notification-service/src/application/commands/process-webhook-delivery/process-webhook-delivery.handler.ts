import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import * as crypto from "crypto";
import { ProcessWebhookDeliveryCommand } from "./process-webhook-delivery.command";
import type { IWebhookEndpointRepository } from "../../../domain/repositories/webhook-endpoint.repository.interface";
import { WebhookEndpointNotFoundException } from "../../../domain/exceptions/notification.exceptions";
import { LoggerService } from "../../../infrastructure/logger/logger.service";

@CommandHandler(ProcessWebhookDeliveryCommand)
export class ProcessWebhookDeliveryHandler
  implements ICommandHandler<ProcessWebhookDeliveryCommand>
{
  constructor(
    @Inject("IWebhookEndpointRepository")
    private readonly webhookRepo: IWebhookEndpointRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: ProcessWebhookDeliveryCommand): Promise<void> {
    const { webhookEndpointId, eventType, payload } = command;

    const endpoint = await this.webhookRepo.findById(webhookEndpointId);
    if (!endpoint) {
      throw new WebhookEndpointNotFoundException(webhookEndpointId);
    }

    if (!endpoint.isActive()) {
      this.logger.info("Webhook endpoint is disabled, skipping delivery", {
        action: "webhook.skip",
        webhookEndpointId,
      });
      return;
    }

    const body = JSON.stringify(payload);
    const signature = crypto
      .createHmac("sha256", endpoint.secret)
      .update(body)
      .digest("hex");

    const deliveryId = crypto.randomUUID();

    try {
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Webhook-Signature": `sha256=${signature}`,
          "X-Webhook-Event": eventType,
          "X-Webhook-Delivery": deliveryId,
        },
        body,
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok) {
        endpoint.recordSuccess();
        this.logger.info("Webhook delivered successfully", {
          action: "webhook.delivered",
          webhookEndpointId,
          eventType,
          deliveryId,
        });
      } else {
        endpoint.recordFailure();
        this.logger.warn(
          `Webhook delivery failed with status ${response.status}`,
          {
            action: "webhook.failed",
            webhookEndpointId,
            eventType,
            statusCode: response.status,
          },
        );
      }
    } catch (error) {
      endpoint.recordFailure();
      this.logger.error("Webhook delivery error", error, {
        action: "webhook.error",
        webhookEndpointId,
        eventType,
      });
    }

    await this.webhookRepo.save(endpoint);
  }
}
