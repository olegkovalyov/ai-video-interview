import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ListWebhookEndpointsQuery } from "./list-webhook-endpoints.query";
import type { IWebhookEndpointRepository } from "../../../domain/repositories/webhook-endpoint.repository.interface";
import type { WebhookEndpointResponseDto } from "../../dto/notification.response.dto";

@QueryHandler(ListWebhookEndpointsQuery)
export class ListWebhookEndpointsHandler
  implements IQueryHandler<ListWebhookEndpointsQuery>
{
  constructor(
    @Inject("IWebhookEndpointRepository")
    private readonly webhookRepo: IWebhookEndpointRepository,
  ) {}

  async execute(
    query: ListWebhookEndpointsQuery,
  ): Promise<WebhookEndpointResponseDto[]> {
    const endpoints = await this.webhookRepo.findByCompanyId(query.companyId);

    return endpoints.map((e) => ({
      id: e.id,
      companyId: e.companyId,
      url: e.url,
      events: e.events,
      status: e.status,
      failureCount: e.failureCount,
      lastDeliveryAt: e.lastDeliveryAt?.toISOString() || null,
      createdAt: e.createdAt.toISOString(),
    }));
  }
}
