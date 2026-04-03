import { ValueObject } from "../base/base.value-object";

export type SubscriptionStatusValue =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";

const VALID_STATUSES: SubscriptionStatusValue[] = [
  "active",
  "past_due",
  "canceled",
  "trialing",
];

/**
 * SubscriptionStatus Value Object
 * State machine for subscription lifecycle
 *
 * Transitions:
 *   active -> past_due (payment failed)
 *   active -> canceled (customer canceled or subscription deleted)
 *   past_due -> active (payment retry succeeded)
 *   past_due -> canceled (grace period expired)
 *   trialing -> active (trial ended, payment succeeded)
 *   trialing -> canceled (trial ended, no payment)
 */
export class SubscriptionStatus extends ValueObject<{
  value: SubscriptionStatusValue;
}> {
  private constructor(value: SubscriptionStatusValue) {
    super({ value });
  }

  public static create(value: string): SubscriptionStatus {
    if (!VALID_STATUSES.includes(value as SubscriptionStatusValue)) {
      throw new Error(
        `Invalid subscription status: ${value}. Must be one of: ${VALID_STATUSES.join(", ")}`,
      );
    }
    return new SubscriptionStatus(value as SubscriptionStatusValue);
  }

  public static active(): SubscriptionStatus {
    return new SubscriptionStatus("active");
  }

  public static pastDue(): SubscriptionStatus {
    return new SubscriptionStatus("past_due");
  }

  public static canceled(): SubscriptionStatus {
    return new SubscriptionStatus("canceled");
  }

  public static trialing(): SubscriptionStatus {
    return new SubscriptionStatus("trialing");
  }

  public get value(): SubscriptionStatusValue {
    return this.props.value;
  }

  public isActive(): boolean {
    return this.props.value === "active";
  }

  public isPastDue(): boolean {
    return this.props.value === "past_due";
  }

  public isCanceled(): boolean {
    return this.props.value === "canceled";
  }

  public isTrialing(): boolean {
    return this.props.value === "trialing";
  }

  /**
   * Subscription is usable (active or trialing or past_due within grace period)
   */
  public isUsable(): boolean {
    return this.isActive() || this.isTrialing() || this.isPastDue();
  }

  /**
   * Can upgrade plan
   */
  public canUpgrade(): boolean {
    return this.isActive() || this.isTrialing();
  }

  /**
   * Can cancel subscription
   */
  public canCancel(): boolean {
    return this.isActive() || this.isTrialing() || this.isPastDue();
  }

  /**
   * Can resume (undo cancel before period end)
   */
  public canResume(): boolean {
    return this.isActive(); // Only active subscriptions with cancelAtPeriodEnd can resume
  }

  /**
   * Can transition to past_due
   */
  public canMarkPastDue(): boolean {
    return this.isActive() || this.isTrialing();
  }

  /**
   * Can transition to canceled
   */
  public canMarkCanceled(): boolean {
    return this.isActive() || this.isPastDue() || this.isTrialing();
  }

  /**
   * Terminal state — no further transitions
   */
  public isTerminal(): boolean {
    return this.isCanceled();
  }

  public toString(): string {
    return this.props.value;
  }
}
