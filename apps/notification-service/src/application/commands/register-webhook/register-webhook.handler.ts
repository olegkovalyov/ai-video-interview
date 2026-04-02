import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import * as crypto from "crypto";
import { RegisterWebhookCommand } from "./register-webhook.command";
import { WebhookEndpoint } from "../../../domain/aggregates/webhook-endpoint.aggregate";
import type { IWebhookEndpointRepository } from "../../../domain/repositories/webhook-endpoint.repository.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";

@CommandHandler(RegisterWebhookCommand)
export class RegisterWebhookHandler
  implements ICommandHandler<RegisterWebhookCommand>
{
  constructor(
    @Inject("IWebhookEndpointRepository")
    private readonly webhookRepo: IWebhookEndpointRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: RegisterWebhookCommand): Promise<string> {
    const { companyId, url, events } = command;

    const webhookId = uuid();
    const secret = crypto.randomBytes(32).toString("hex");

    const endpoint = WebhookEndpoint.create({
      id: webhookId,
      companyId,
      url,
      secret,
      events,
    });

    await this.webhookRepo.save(endpoint);

    this.logger.commandLog("RegisterWebhook", true, {
      action: "register_webhook",
      webhookEndpointId: webhookId,
      companyId,
    });

    return webhookId;
  }
}
