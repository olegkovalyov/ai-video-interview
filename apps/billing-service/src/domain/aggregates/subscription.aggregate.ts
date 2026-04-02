import { AggregateRoot } from "../base/base.aggregate-root";
import { PlanType } from "../value-objects/plan-type.vo";
import { SubscriptionStatus } from "../value-objects/subscription-status.vo";
import { SubscriptionCreatedEvent } from "../events/subscription-created.event";
import { SubscriptionUpgradedEvent } from "../events/subscription-upgraded.event";
import { SubscriptionCanceledEvent } from "../events/subscription-canceled.event";
import { SubscriptionPastDueEvent } from "../events/subscription-past-due.event";
import {
  InvalidPlanTransitionException,
  InvalidSubscriptionStateException,
} from "../exceptions/billing.exceptions";

interface SubscriptionProps {
  companyId: string;
  planType: PlanType;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt: Date | null;
  trialEnd: Date | null;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Subscription Aggregate Root
 *
 * Manages the lifecycle of a company subscription.
 * One subscription per company (enforced by UNIQUE constraint on companyId).
 *
 * State Machine:
 *   active -> past_due (payment failed)
 *   active -> canceled (customer canceled or subscription deleted)
 *   past_due -> active (payment retry succeeded)
 *   past_due -> canceled (grace period expired)
 *   trialing -> active (trial ended, payment succeeded)
 *   trialing -> canceled (trial ended, no payment)
 */
export class Subscription extends AggregateRoot {
  private readonly _id: string;
  private props: SubscriptionProps;

  private constructor(id: string, props: SubscriptionProps) {
    super();
    this._id = id;
    this.props = props;
  }

  /**
   * Factory method: create a new free subscription for a company
   * Emits SubscriptionCreatedEvent
   */
  public static create(id: string, companyId: string): Subscription {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const subscription = new Subscription(id, {
      companyId,
      planType: PlanType.free(),
      status: SubscriptionStatus.active(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialEnd: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    subscription.apply(new SubscriptionCreatedEvent(id, companyId, "free"));

    return subscription;
  }

  /**
   * Factory method: reconstitute from persistence (no events emitted)
   */
  public static reconstitute(
    id: string,
    props: SubscriptionProps,
  ): Subscription {
    return new Subscription(id, props);
  }

  // ---- Getters ----

  public get id(): string {
    return this._id;
  }

  public get companyId(): string {
    return this.props.companyId;
  }

  public get planType(): PlanType {
    return this.props.planType;
  }

  public get status(): SubscriptionStatus {
    return this.props.status;
  }

  public get stripeCustomerId(): string | null {
    return this.props.stripeCustomerId;
  }

  public get stripeSubscriptionId(): string | null {
    return this.props.stripeSubscriptionId;
  }

  public get currentPeriodStart(): Date {
    return this.props.currentPeriodStart;
  }

  public get currentPeriodEnd(): Date {
    return this.props.currentPeriodEnd;
  }

  public get cancelAtPeriodEnd(): boolean {
    return this.props.cancelAtPeriodEnd;
  }

  public get canceledAt(): Date | null {
    return this.props.canceledAt;
  }

  public get trialEnd(): Date | null {
    return this.props.trialEnd;
  }

  public get version(): number {
    return this.props.version;
  }

  public get createdAt(): Date {
    return this.props.createdAt;
  }

  public get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ---- Business Methods ----

  /**
   * Upgrade to a new plan (after Stripe checkout completed)
   */
  public upgrade(
    newPlanType: PlanType,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    periodStart: Date,
    periodEnd: Date,
  ): void {
    if (!this.props.status.canUpgrade()) {
      throw new InvalidSubscriptionStateException(
        "upgrade",
        this.props.status.value,
      );
    }

    if (!this.props.planType.canUpgradeTo(newPlanType)) {
      throw new InvalidPlanTransitionException(
        this.props.planType.value,
        newPlanType.value,
      );
    }

    const previousPlan = this.props.planType.value;

    this.props.planType = newPlanType;
    this.props.stripeCustomerId = stripeCustomerId;
    this.props.stripeSubscriptionId = stripeSubscriptionId;
    this.props.currentPeriodStart = periodStart;
    this.props.currentPeriodEnd = periodEnd;
    this.props.cancelAtPeriodEnd = false;
    this.props.canceledAt = null;
    this.props.updatedAt = new Date();

    this.apply(
      new SubscriptionUpgradedEvent(
        this._id,
        this.props.companyId,
        previousPlan,
        newPlanType.value,
        stripeSubscriptionId,
      ),
    );
  }

  /**
   * Cancel subscription (sets cancelAtPeriodEnd)
   */
  public cancel(): void {
    if (!this.props.status.canCancel()) {
      throw new InvalidSubscriptionStateException(
        "cancel",
        this.props.status.value,
      );
    }

    this.props.cancelAtPeriodEnd = true;
    this.props.canceledAt = new Date();
    this.props.updatedAt = new Date();

    this.apply(
      new SubscriptionCanceledEvent(
        this._id,
        this.props.companyId,
        this.props.planType.value,
        true,
      ),
    );
  }

  /**
   * Resume subscription (undo cancel before period end)
   */
  public resume(): void {
    if (!this.props.status.canResume()) {
      throw new InvalidSubscriptionStateException(
        "resume",
        this.props.status.value,
      );
    }

    if (!this.props.cancelAtPeriodEnd) {
      throw new InvalidSubscriptionStateException(
        "resume",
        "subscription is not scheduled for cancellation",
      );
    }

    this.props.cancelAtPeriodEnd = false;
    this.props.canceledAt = null;
    this.props.updatedAt = new Date();
  }

  /**
   * Mark subscription as past due (payment failed)
   */
  public markPastDue(): void {
    if (!this.props.status.canMarkPastDue()) {
      throw new InvalidSubscriptionStateException(
        "mark past due",
        this.props.status.value,
      );
    }

    this.props.status = SubscriptionStatus.pastDue();
    this.props.updatedAt = new Date();

    this.apply(
      new SubscriptionPastDueEvent(
        this._id,
        this.props.companyId,
        this.props.planType.value,
      ),
    );
  }

  /**
   * Mark subscription as canceled (final state)
   */
  public markCanceled(): void {
    if (!this.props.status.canMarkCanceled()) {
      throw new InvalidSubscriptionStateException(
        "mark canceled",
        this.props.status.value,
      );
    }

    this.props.status = SubscriptionStatus.canceled();
    this.props.canceledAt = this.props.canceledAt || new Date();
    this.props.updatedAt = new Date();

    this.apply(
      new SubscriptionCanceledEvent(
        this._id,
        this.props.companyId,
        this.props.planType.value,
        false,
      ),
    );
  }

  /**
   * Renew period (after successful invoice payment)
   */
  public renewPeriod(periodStart: Date, periodEnd: Date): void {
    this.props.status = SubscriptionStatus.active();
    this.props.currentPeriodStart = periodStart;
    this.props.currentPeriodEnd = periodEnd;
    this.props.cancelAtPeriodEnd = false;
    this.props.updatedAt = new Date();
  }
}
