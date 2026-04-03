import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, EntityManager } from "typeorm";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import type { ITransactionContext } from "../../../application/interfaces/transaction-context.interface";
import { Subscription } from "../../../domain/aggregates/subscription.aggregate";
import { UsageRecord } from "../../../domain/entities/usage-record.entity";
import { PaymentEvent } from "../../../domain/entities/payment-event.entity";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { UsageRecordEntity } from "../entities/usage-record.entity";
import { PaymentEventEntity } from "../entities/payment-event.entity";
import { SubscriptionMapper } from "../mappers/subscription.mapper";

@Injectable()
export class TypeOrmSubscriptionRepository implements ISubscriptionRepository {
  constructor(
    @InjectRepository(SubscriptionEntity)
    private readonly subscriptionRepo: Repository<SubscriptionEntity>,
    @InjectRepository(UsageRecordEntity)
    private readonly usageRecordRepo: Repository<UsageRecordEntity>,
    @InjectRepository(PaymentEventEntity)
    private readonly paymentEventRepo: Repository<PaymentEventEntity>,
  ) {}

  async findById(id: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepo.findOne({ where: { id } });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findByCompanyId(companyId: string): Promise<Subscription | null> {
    const entity = await this.subscriptionRepo.findOne({
      where: { companyId },
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async findByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<Subscription | null> {
    const entity = await this.subscriptionRepo.findOne({
      where: { stripeCustomerId },
    });
    return entity ? SubscriptionMapper.toDomain(entity) : null;
  }

  async save(
    subscription: Subscription,
    tx?: ITransactionContext,
  ): Promise<void> {
    const data = SubscriptionMapper.toPersistence(subscription);
    if (tx) {
      await (tx as unknown as EntityManager).save(SubscriptionEntity, data);
    } else {
      await this.subscriptionRepo.save(data);
    }
  }

  async findUsageRecord(
    subscriptionId: string,
    period: string,
  ): Promise<UsageRecord | null> {
    const entity = await this.usageRecordRepo.findOne({
      where: { subscriptionId, period },
    });
    return entity ? SubscriptionMapper.usageRecordToDomain(entity) : null;
  }

  async saveUsageRecord(
    usageRecord: UsageRecord,
    tx?: ITransactionContext,
  ): Promise<void> {
    const data = SubscriptionMapper.usageRecordToPersistence(usageRecord);
    if (tx) {
      await (tx as unknown as EntityManager).save(UsageRecordEntity, data);
    } else {
      await this.usageRecordRepo.save(data);
    }
  }

  async incrementUsageAtomic(
    subscriptionId: string,
    period: string,
    resource: "interviews" | "analysisTokens" | "storage",
    amount: number,
  ): Promise<void> {
    const columnMap: Record<string, string> = {
      interviews: "interviews_used",
      analysisTokens: "analysis_tokens_used",
      storage: "storage_used_mb",
    };
    const column = columnMap[resource];

    // Atomic upsert: INSERT or INCREMENT on conflict
    // Uses raw SQL because TypeORM's orUpdate generates SET col = EXCLUDED.col (overwrite)
    // instead of SET col = col + EXCLUDED.col (increment)
    await this.usageRecordRepo.query(
      `INSERT INTO usage_records (id, subscription_id, period, ${column})
       VALUES (uuid_generate_v4(), $1, $2, $3)
       ON CONFLICT (subscription_id, period)
       DO UPDATE SET ${column} = usage_records.${column} + $3, updated_at = NOW()`,
      [subscriptionId, period, amount],
    );
  }

  async findPaymentEventByStripeId(
    stripeEventId: string,
  ): Promise<PaymentEvent | null> {
    const entity = await this.paymentEventRepo.findOne({
      where: { stripeEventId },
    });
    return entity ? SubscriptionMapper.paymentEventToDomain(entity) : null;
  }

  async savePaymentEvent(
    paymentEvent: PaymentEvent,
    tx?: ITransactionContext,
  ): Promise<void> {
    const data = SubscriptionMapper.paymentEventToPersistence(paymentEvent);
    if (tx) {
      await (tx as unknown as EntityManager).save(PaymentEventEntity, data);
    } else {
      await this.paymentEventRepo.save(data);
    }
  }
}
