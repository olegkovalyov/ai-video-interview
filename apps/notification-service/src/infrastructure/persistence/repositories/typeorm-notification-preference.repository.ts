import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import type { INotificationPreferenceRepository } from "../../../domain/repositories/notification-preference.repository.interface";
import type { ITransactionContext } from "../../../application/interfaces/transaction-context.interface";
import { NotificationPreference } from "../../../domain/entities/notification-preference.entity";
import { NotificationPreferenceEntity } from "../entities/notification-preference.entity";
import { NotificationPreferenceMapper } from "../mappers/notification.mapper";

@Injectable()
export class TypeOrmNotificationPreferenceRepository
  implements INotificationPreferenceRepository
{
  constructor(
    @InjectRepository(NotificationPreferenceEntity)
    private readonly repo: Repository<NotificationPreferenceEntity>,
  ) {}

  async save(
    preference: NotificationPreference,
    tx?: ITransactionContext,
  ): Promise<void> {
    const entity = NotificationPreferenceMapper.toEntity(preference);

    if (tx) {
      await (tx as unknown as EntityManager).save(
        NotificationPreferenceEntity,
        entity,
      );
    } else {
      await this.repo.save(entity);
    }
  }

  async findByUserId(userId: string): Promise<NotificationPreference | null> {
    const entity = await this.repo.findOne({ where: { userId } });
    return entity ? NotificationPreferenceMapper.toDomain(entity) : null;
  }
}
