import { Subscription } from "../subscription.aggregate";
import { PlanType } from "../../value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../value-objects/subscription-status.vo";
import { SubscriptionCreatedEvent } from "../../events/subscription-created.event";
import { SubscriptionUpgradedEvent } from "../../events/subscription-upgraded.event";
import { SubscriptionCanceledEvent } from "../../events/subscription-canceled.event";
import { SubscriptionPastDueEvent } from "../../events/subscription-past-due.event";
import {
  InvalidPlanTransitionException,
  InvalidSubscriptionStateException,
} from "../../exceptions/billing.exceptions";

describe("Subscription Aggregate", () => {
  const companyId = "company-123";

  const createFreeSubscription = (id = "sub-1") => {
    return Subscription.create(id, companyId);
  };

  const createActiveSubscription = (
    id = "sub-1",
    planType: PlanType = PlanType.free(),
  ) => {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return Subscription.reconstitute(id, {
      companyId,
      planType,
      status: SubscriptionStatus.active(),
      stripeCustomerId: planType.isFree() ? null : "cus_123",
      stripeSubscriptionId: planType.isFree() ? null : "sub_stripe_123",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialEnd: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  };

  const createCancelingSubscription = (id = "sub-1") => {
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return Subscription.reconstitute(id, {
      companyId,
      planType: PlanType.plus(),
      status: SubscriptionStatus.active(),
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_stripe_123",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
      canceledAt: new Date(),
      trialEnd: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
  };

  describe("create()", () => {
    it("should create a subscription with free plan and active status", () => {
      const subscription = createFreeSubscription();

      expect(subscription.id).toBe("sub-1");
      expect(subscription.companyId).toBe(companyId);
      expect(subscription.planType.isFree()).toBe(true);
      expect(subscription.status.isActive()).toBe(true);
      expect(subscription.stripeCustomerId).toBeNull();
      expect(subscription.stripeSubscriptionId).toBeNull();
      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.canceledAt).toBeNull();
      expect(subscription.trialEnd).toBeNull();
      expect(subscription.version).toBe(1);
    });

    it("should set currentPeriodEnd to 30 days from now", () => {
      const before = Date.now();
      const subscription = createFreeSubscription();
      const after = Date.now();

      const expectedMin = before + 30 * 24 * 60 * 60 * 1000;
      const expectedMax = after + 30 * 24 * 60 * 60 * 1000;

      expect(subscription.currentPeriodEnd.getTime()).toBeGreaterThanOrEqual(
        expectedMin,
      );
      expect(subscription.currentPeriodEnd.getTime()).toBeLessThanOrEqual(
        expectedMax,
      );
    });

    it("should raise SubscriptionCreatedEvent", () => {
      const subscription = createFreeSubscription();
      const events = subscription.getUncommittedEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionCreatedEvent);
      expect(events[0].aggregateId).toBe("sub-1");
      expect((events[0] as SubscriptionCreatedEvent).companyId).toBe(companyId);
      expect((events[0] as SubscriptionCreatedEvent).planType).toBe("free");
    });
  });

  describe("reconstitute()", () => {
    it("should reconstitute without emitting events", () => {
      const subscription = createActiveSubscription();
      const events = subscription.getUncommittedEvents();

      expect(events).toHaveLength(0);
      expect(subscription.companyId).toBe(companyId);
    });
  });

  describe("upgrade()", () => {
    const periodStart = new Date();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    it("should upgrade from free to plus", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.free());

      subscription.upgrade(
        PlanType.plus(),
        "cus_new",
        "sub_stripe_new",
        periodStart,
        periodEnd,
      );

      expect(subscription.planType.isPlus()).toBe(true);
      expect(subscription.stripeCustomerId).toBe("cus_new");
      expect(subscription.stripeSubscriptionId).toBe("sub_stripe_new");
      expect(subscription.currentPeriodStart).toBe(periodStart);
      expect(subscription.currentPeriodEnd).toBe(periodEnd);
      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.canceledAt).toBeNull();
    });

    it("should upgrade from free to pro", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.free());

      subscription.upgrade(
        PlanType.pro(),
        "cus_new",
        "sub_stripe_new",
        periodStart,
        periodEnd,
      );

      expect(subscription.planType.isPro()).toBe(true);
    });

    it("should upgrade from plus to pro", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      subscription.upgrade(
        PlanType.pro(),
        "cus_new",
        "sub_stripe_new",
        periodStart,
        periodEnd,
      );

      expect(subscription.planType.isPro()).toBe(true);
    });

    it("should raise SubscriptionUpgradedEvent", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.free());

      subscription.upgrade(
        PlanType.plus(),
        "cus_new",
        "sub_stripe_new",
        periodStart,
        periodEnd,
      );

      const events = subscription.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionUpgradedEvent);

      const event = events[0] as SubscriptionUpgradedEvent;
      expect(event.aggregateId).toBe("sub-1");
      expect(event.companyId).toBe(companyId);
      expect(event.previousPlan).toBe("free");
      expect(event.newPlan).toBe("plus");
      expect(event.stripeSubscriptionId).toBe("sub_stripe_new");
    });

    it("should throw on downgrade from pro to plus", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.pro());

      expect(() =>
        subscription.upgrade(
          PlanType.plus(),
          "cus_new",
          "sub_stripe_new",
          periodStart,
          periodEnd,
        ),
      ).toThrow(InvalidPlanTransitionException);
    });

    it("should throw on same plan upgrade", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      expect(() =>
        subscription.upgrade(
          PlanType.plus(),
          "cus_new",
          "sub_stripe_new",
          periodStart,
          periodEnd,
        ),
      ).toThrow(InvalidPlanTransitionException);
    });

    it("should throw on downgrade from plus to free", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      expect(() =>
        subscription.upgrade(
          PlanType.free(),
          "cus_new",
          "sub_stripe_new",
          periodStart,
          periodEnd,
        ),
      ).toThrow(InvalidPlanTransitionException);
    });

    it("should throw when subscription is canceled", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.free(),
        status: SubscriptionStatus.canceled(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: now,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(() =>
        subscription.upgrade(
          PlanType.plus(),
          "cus_new",
          "sub_stripe_new",
          periodStart,
          periodEnd,
        ),
      ).toThrow(InvalidSubscriptionStateException);
    });
  });

  describe("cancel()", () => {
    it("should set cancelAtPeriodEnd to true and emit event", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      subscription.cancel();

      expect(subscription.cancelAtPeriodEnd).toBe(true);
      expect(subscription.canceledAt).toBeInstanceOf(Date);
    });

    it("should raise SubscriptionCanceledEvent with cancelAtPeriodEnd=true", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      subscription.cancel();

      const events = subscription.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionCanceledEvent);

      const event = events[0] as SubscriptionCanceledEvent;
      expect(event.aggregateId).toBe("sub-1");
      expect(event.companyId).toBe(companyId);
      expect(event.planType).toBe("plus");
      expect(event.cancelAtPeriodEnd).toBe(true);
    });

    it("should throw when subscription is already canceled (terminal state)", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.canceled(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: now,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(() => subscription.cancel()).toThrow(
        InvalidSubscriptionStateException,
      );
    });

    it("should allow cancel when past_due", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.pastDue(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      subscription.cancel();

      expect(subscription.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe("resume()", () => {
    it("should set cancelAtPeriodEnd to false and clear canceledAt", () => {
      const subscription = createCancelingSubscription();

      subscription.resume();

      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.canceledAt).toBeNull();
    });

    it("should throw when subscription is not scheduled for cancellation", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      expect(() => subscription.resume()).toThrow(
        InvalidSubscriptionStateException,
      );
    });

    it("should throw when subscription is canceled (terminal)", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.canceled(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: true,
        canceledAt: now,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(() => subscription.resume()).toThrow(
        InvalidSubscriptionStateException,
      );
    });

    it("should throw when subscription is past_due", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.pastDue(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: true,
        canceledAt: now,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(() => subscription.resume()).toThrow(
        InvalidSubscriptionStateException,
      );
    });
  });

  describe("markPastDue()", () => {
    it("should transition active subscription to past_due", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      subscription.markPastDue();

      expect(subscription.status.isPastDue()).toBe(true);
    });

    it("should raise SubscriptionPastDueEvent", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      subscription.markPastDue();

      const events = subscription.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionPastDueEvent);

      const event = events[0] as SubscriptionPastDueEvent;
      expect(event.aggregateId).toBe("sub-1");
      expect(event.companyId).toBe(companyId);
      expect(event.planType).toBe("plus");
    });

    it("should throw when subscription is already canceled", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.canceled(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: now,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(() => subscription.markPastDue()).toThrow(
        InvalidSubscriptionStateException,
      );
    });

    it("should throw when subscription is already past_due", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.pastDue(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(() => subscription.markPastDue()).toThrow(
        InvalidSubscriptionStateException,
      );
    });
  });

  describe("markCanceled()", () => {
    it("should transition to canceled (terminal state)", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      subscription.markCanceled();

      expect(subscription.status.isCanceled()).toBe(true);
      expect(subscription.canceledAt).toBeInstanceOf(Date);
    });

    it("should raise SubscriptionCanceledEvent with cancelAtPeriodEnd=false", () => {
      const subscription = createActiveSubscription("sub-1", PlanType.plus());

      subscription.markCanceled();

      const events = subscription.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(SubscriptionCanceledEvent);

      const event = events[0] as SubscriptionCanceledEvent;
      expect(event.cancelAtPeriodEnd).toBe(false);
    });

    it("should transition past_due to canceled", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.pastDue(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      subscription.markCanceled();

      expect(subscription.status.isCanceled()).toBe(true);
    });

    it("should throw when already canceled", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.canceled(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: false,
        canceledAt: now,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      expect(() => subscription.markCanceled()).toThrow(
        InvalidSubscriptionStateException,
      );
    });

    it("should preserve existing canceledAt if already set", () => {
      const canceledAt = new Date("2026-01-15");
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.active(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: now,
        currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        cancelAtPeriodEnd: true,
        canceledAt,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      subscription.markCanceled();

      expect(subscription.canceledAt).toBe(canceledAt);
    });
  });

  describe("renewPeriod()", () => {
    it("should update period dates and set status to active", () => {
      const now = new Date();
      const subscription = Subscription.reconstitute("sub-1", {
        companyId,
        planType: PlanType.plus(),
        status: SubscriptionStatus.pastDue(),
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_stripe_123",
        currentPeriodStart: new Date("2026-01-01"),
        currentPeriodEnd: new Date("2026-01-31"),
        cancelAtPeriodEnd: true,
        canceledAt: null,
        trialEnd: null,
        version: 1,
        createdAt: now,
        updatedAt: now,
      });

      const newStart = new Date("2026-02-01");
      const newEnd = new Date("2026-03-01");

      subscription.renewPeriod(newStart, newEnd);

      expect(subscription.status.isActive()).toBe(true);
      expect(subscription.currentPeriodStart).toBe(newStart);
      expect(subscription.currentPeriodEnd).toBe(newEnd);
      expect(subscription.cancelAtPeriodEnd).toBe(false);
    });

    it("should reset cancelAtPeriodEnd on renewal", () => {
      const subscription = createCancelingSubscription();

      const newStart = new Date("2026-02-01");
      const newEnd = new Date("2026-03-01");

      subscription.renewPeriod(newStart, newEnd);

      expect(subscription.cancelAtPeriodEnd).toBe(false);
      expect(subscription.status.isActive()).toBe(true);
    });
  });
});
