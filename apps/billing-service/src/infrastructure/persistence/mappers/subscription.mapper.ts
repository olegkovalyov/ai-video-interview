import { Subscription } from "../../../domain/aggregates/subscription.aggregate";
import { PlanType } from "../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../domain/value-objects/subscription-status.vo";
import { UsageRecord } from "../../../domain/entities/usage-record.entity";
import { PaymentEvent } from "../../../domain/entities/payment-event.entity";
import { SubscriptionEntity } from "../entities/subscription.entity";
import { UsageRecordEntity } from "../entities/usage-record.entity";
import { PaymentEventEntity } from "../entities/payment-event.entity";

export class SubscriptionMapper {
  static toDomain(entity: SubscriptionEntity): Subscription {
    return Subscription.reconstitute(entity.id, {
      companyId: entity.companyId,
      planType: PlanType.create(entity.planType),
      status: SubscriptionStatus.create(entity.status),
      stripeCustomerId: entity.stripeCustomerId,
      stripeSubscriptionId: entity.stripeSubscriptionId,
      currentPeriodStart: entity.currentPeriodStart,
      currentPeriodEnd: entity.currentPeriodEnd,
      cancelAtPeriodEnd: entity.cancelAtPeriodEnd,
      canceledAt: entity.canceledAt,
      trialEnd: entity.trialEnd,
      version: entity.version,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static toPersistence(domain: Subscription): Partial<SubscriptionEntity> {
    return {
      id: domain.id,
      companyId: domain.companyId,
      planType: domain.planType.value,
      status: domain.status.value,
      stripeCustomerId: domain.stripeCustomerId,
      stripeSubscriptionId: domain.stripeSubscriptionId,
      currentPeriodStart: domain.currentPeriodStart,
      currentPeriodEnd: domain.currentPeriodEnd,
      cancelAtPeriodEnd: domain.cancelAtPeriodEnd,
      canceledAt: domain.canceledAt,
      trialEnd: domain.trialEnd,
      version: domain.version,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static usageRecordToDomain(entity: UsageRecordEntity): UsageRecord {
    return UsageRecord.reconstitute(entity.id, {
      subscriptionId: entity.subscriptionId,
      period: entity.period,
      interviewsUsed: entity.interviewsUsed,
      analysisTokensUsed: entity.analysisTokensUsed,
      storageUsedMb: Number(entity.storageUsedMb),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  }

  static usageRecordToPersistence(
    domain: UsageRecord,
  ): Partial<UsageRecordEntity> {
    return {
      id: domain.id,
      subscriptionId: domain.subscriptionId,
      period: domain.period,
      interviewsUsed: domain.interviewsUsed,
      analysisTokensUsed: domain.analysisTokensUsed,
      storageUsedMb: domain.storageUsedMb,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static paymentEventToDomain(entity: PaymentEventEntity): PaymentEvent {
    return PaymentEvent.reconstitute(entity.id, {
      subscriptionId: entity.subscriptionId,
      stripeEventId: entity.stripeEventId,
      eventType: entity.eventType,
      data: entity.data,
      processedAt: entity.processedAt,
    });
  }

  static paymentEventToPersistence(
    domain: PaymentEvent,
  ): Partial<PaymentEventEntity> {
    return {
      id: domain.id,
      subscriptionId: domain.subscriptionId,
      stripeEventId: domain.stripeEventId,
      eventType: domain.eventType,
      data: domain.data,
      processedAt: domain.processedAt,
    };
  }
}
