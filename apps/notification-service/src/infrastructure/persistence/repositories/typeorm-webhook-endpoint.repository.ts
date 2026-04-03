import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import type { IWebhookEndpointRepository } from "../../../domain/repositories/webhook-endpoint.repository.interface";
import type { ITransactionContext } from "../../../application/interfaces/transaction-context.interface";
import { WebhookEndpoint } from "../../../domain/aggregates/webhook-endpoint.aggregate";
import { WebhookEndpointEntity } from "../entities/webhook-endpoint.entity";
import { WebhookEndpointMapper } from "../mappers/notification.mapper";

@Injectable()
export class TypeOrmWebhookEndpointRepository
  implements IWebhookEndpointRepository
{
  constructor(
    @InjectRepository(WebhookEndpointEntity)
    private readonly repo: Repository<WebhookEndpointEntity>,
  ) {}

  async save(
    endpoint: WebhookEndpoint,
    tx?: ITransactionContext,
  ): Promise<void> {
    const entity = WebhookEndpointMapper.toEntity(endpoint);

    if (tx) {
      await (tx as unknown as EntityManager).save(
        WebhookEndpointEntity,
        entity,
      );
    } else {
      await this.repo.save(entity);
    }
  }

  async findById(id: string): Promise<WebhookEndpoint | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? WebhookEndpointMapper.toDomain(entity) : null;
  }

  async findByCompanyId(companyId: string): Promise<WebhookEndpoint[]> {
    const entities = await this.repo.find({
      where: { companyId },
      order: { createdAt: "DESC" },
    });

    return entities.map(WebhookEndpointMapper.toDomain);
  }

  async findActiveByEventType(eventType: string): Promise<WebhookEndpoint[]> {
    // Query endpoints where status is active and events array contains the eventType
    const entities = await this.repo
      .createQueryBuilder("webhook")
      .where("webhook.status = :status", { status: "active" })
      .andWhere(":eventType = ANY(webhook.events)", { eventType })
      .getMany();

    return entities.map(WebhookEndpointMapper.toDomain);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
