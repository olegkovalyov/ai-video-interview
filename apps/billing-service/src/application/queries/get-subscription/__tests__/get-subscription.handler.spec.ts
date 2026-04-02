import { GetSubscriptionHandler } from "../get-subscription.handler";
import { GetSubscriptionQuery } from "../get-subscription.query";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import { SubscriptionNotFoundException } from "../../../../domain/exceptions/billing.exceptions";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";

describe("GetSubscriptionHandler", () => {
  let handler: GetSubscriptionHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;

  const createSubscription = (planType: PlanType = PlanType.free()) => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const periodEnd = new Date("2026-03-31T00:00:00.000Z");
    return Subscription.reconstitute("sub-1", {
      companyId: "company-123",
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

  beforeEach(() => {
    subscriptionRepo = {
      findById: jest.fn(),
      findByCompanyId: jest.fn(),
      findByStripeCustomerId: jest.fn(),
      save: jest.fn(),
      findUsageRecord: jest.fn(),
      saveUsageRecord: jest.fn(),
      findPaymentEventByStripeId: jest.fn(),
      savePaymentEvent: jest.fn(),
      incrementUsageAtomic: jest.fn(),
    };

    handler = new GetSubscriptionHandler(subscriptionRepo);
  });

  it("should return subscription with plan details for free plan", async () => {
    const subscription = createSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const query = new GetSubscriptionQuery("company-123");
    const result = await handler.execute(query);

    expect(result.id).toBe("sub-1");
    expect(result.companyId).toBe("company-123");
    expect(result.planType).toBe("free");
    expect(result.planName).toBe("Free");
    expect(result.status).toBe("active");
    expect(result.limits).toEqual({
      interviewsPerMonth: 3,
      maxTemplates: 5,
      maxTeamMembers: 1,
    });
    expect(result.features).toEqual(["basic_analysis"]);
    expect(result.stripeCustomerId).toBeNull();
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.canceledAt).toBeNull();
    expect(result.trialEnd).toBeNull();
    expect(result.currentPeriodStart).toBe("2026-03-01T00:00:00.000Z");
    expect(result.currentPeriodEnd).toBe("2026-03-31T00:00:00.000Z");
  });

  it("should return subscription with plan details for pro plan", async () => {
    const subscription = createSubscription(PlanType.pro());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const query = new GetSubscriptionQuery("company-123");
    const result = await handler.execute(query);

    expect(result.planType).toBe("pro");
    expect(result.planName).toBe("Pro");
    expect(result.limits).toEqual({
      interviewsPerMonth: -1,
      maxTemplates: -1,
      maxTeamMembers: -1,
    });
    expect(result.features).toContain("api_access");
    expect(result.features).toContain("priority_support");
  });

  it("should throw SubscriptionNotFoundException when not found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const query = new GetSubscriptionQuery("company-999");

    await expect(handler.execute(query)).rejects.toThrow(
      SubscriptionNotFoundException,
    );
  });

  it("should include canceledAt as ISO string when set", async () => {
    const now = new Date("2026-03-01T00:00:00.000Z");
    const canceledAt = new Date("2026-03-15T10:00:00.000Z");
    const subscription = Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType: PlanType.plus(),
      status: SubscriptionStatus.active(),
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_stripe_123",
      currentPeriodStart: now,
      currentPeriodEnd: new Date("2026-03-31T00:00:00.000Z"),
      cancelAtPeriodEnd: true,
      canceledAt,
      trialEnd: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const query = new GetSubscriptionQuery("company-123");
    const result = await handler.execute(query);

    expect(result.cancelAtPeriodEnd).toBe(true);
    expect(result.canceledAt).toBe("2026-03-15T10:00:00.000Z");
  });
});
