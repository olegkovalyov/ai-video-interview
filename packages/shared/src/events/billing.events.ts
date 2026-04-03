/**
 * Billing Service Integration Events
 * Published to billing-events Kafka topic via Outbox pattern.
 */

export interface BillingBaseEvent {
  eventId: string;
  eventType: string;
  timestamp: number;
  version: string;
  source: "billing-service";
}

export interface SubscriptionCreatedEvent extends BillingBaseEvent {
  eventType: "subscription.created";
  payload: {
    subscriptionId: string;
    companyId: string;
    planType: string;
  };
}

export interface SubscriptionUpgradedEvent extends BillingBaseEvent {
  eventType: "subscription.upgraded";
  payload: {
    subscriptionId: string;
    companyId: string;
    previousPlan: string;
    newPlan: string;
    stripeSubscriptionId: string;
  };
}

export interface SubscriptionCanceledEvent extends BillingBaseEvent {
  eventType: "subscription.canceled";
  payload: {
    subscriptionId: string;
    companyId: string;
    planType: string;
    cancelAtPeriodEnd?: boolean;
  };
}

export interface SubscriptionPastDueEvent extends BillingBaseEvent {
  eventType: "subscription.past_due";
  payload: {
    subscriptionId: string;
    companyId: string;
    planType: string;
  };
}

export interface QuotaExceededEvent extends BillingBaseEvent {
  eventType: "quota.exceeded";
  payload: {
    subscriptionId: string;
    companyId: string;
    resource: string;
    currentUsage: number;
    limit: number;
    planType: string;
  };
}

export type BillingEvent =
  | SubscriptionCreatedEvent
  | SubscriptionUpgradedEvent
  | SubscriptionCanceledEvent
  | SubscriptionPastDueEvent
  | QuotaExceededEvent;
