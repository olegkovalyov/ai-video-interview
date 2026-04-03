import type { Subscription } from "../aggregates/subscription.aggregate";
import type { UsageRecord } from "../entities/usage-record.entity";
import type { PaymentEvent } from "../entities/payment-event.entity";
import type { ITransactionContext } from "../../application/interfaces/transaction-context.interface";

/**
 * ISubscriptionRepository
 * Domain repository interface for Subscription aggregate.
 * Infrastructure layer provides TypeORM implementation.
 *
 * Inject via token: @Inject('ISubscriptionRepository')
 */
export interface ISubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByCompanyId(companyId: string): Promise<Subscription | null>;
  findByStripeCustomerId(
    stripeCustomerId: string,
  ): Promise<Subscription | null>;
  save(subscription: Subscription, tx?: ITransactionContext): Promise<void>;

  // Usage records
  findUsageRecord(
    subscriptionId: string,
    period: string,
  ): Promise<UsageRecord | null>;
  saveUsageRecord(
    usageRecord: UsageRecord,
    tx?: ITransactionContext,
  ): Promise<void>;

  // Atomic usage increment (prevents race conditions)
  incrementUsageAtomic(
    subscriptionId: string,
    period: string,
    resource: "interviews" | "analysisTokens" | "storage",
    amount: number,
  ): Promise<void>;

  // Payment events (idempotency)
  findPaymentEventByStripeId(
    stripeEventId: string,
  ): Promise<PaymentEvent | null>;
  savePaymentEvent(
    paymentEvent: PaymentEvent,
    tx?: ITransactionContext,
  ): Promise<void>;
}
