import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import type { INotificationRepository } from "../../../domain/repositories/notification.repository.interface";
import type { ITransactionContext } from "../../../application/interfaces/transaction-context.interface";
import { Notification } from "../../../domain/aggregates/notification.aggregate";
import { NotificationEntity } from "../entities/notification.entity";
import { NotificationMapper } from "../mappers/notification.mapper";

@Injectable()
export class TypeOrmNotificationRepository implements INotificationRepository {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly repo: Repository<NotificationEntity>,
  ) {}

  async save(
    notification: Notification,
    tx?: ITransactionContext,
  ): Promise<void> {
    const entity = NotificationMapper.toEntity(notification);

    if (tx) {
      await (tx as unknown as EntityManager).save(NotificationEntity, entity);
    } else {
      await this.repo.save(entity);
    }
  }

  async findById(id: string): Promise<Notification | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? NotificationMapper.toDomain(entity) : null;
  }

  async findByRecipientId(
    recipientId: string,
    options?: { limit?: number; offset?: number },
  ): Promise<Notification[]> {
    const entities = await this.repo.find({
      where: { recipientId },
      order: { createdAt: "DESC" },
      take: options?.limit || 20,
      skip: options?.offset || 0,
    });

    return entities.map(NotificationMapper.toDomain);
  }

  async findUnread(recipientId: string): Promise<Notification[]> {
    const entities = await this.repo.find({
      where: {
        recipientId,
        channel: "in_app",
        status: "pending",
      },
      order: { createdAt: "DESC" },
    });

    return entities.map(NotificationMapper.toDomain);
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.repo.count({
      where: {
        recipientId,
        channel: "in_app",
        status: "pending",
      },
    });
  }
}
