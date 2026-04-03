import { GetUsageHandler } from "../get-usage.handler";
import { GetUsageQuery } from "../get-usage.query";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { UsageRecord } from "../../../../domain/entities/usage-record.entity";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import { SubscriptionNotFoundException } from "../../../../domain/exceptions/billing.exceptions";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";

describe("GetUsageHandler", () => {
  let handler: GetUsageHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;

  const createSubscription = (planType: PlanType = PlanType.free()) => {
    const now = new Date();
    return Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType,
      status: SubscriptionStatus.active(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      currentPeriodStart: now,
      currentPeriodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
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

    handler = new GetUsageHandler(subscriptionRepo);
  });

  it("should return usage data with limits for existing record", async () => {
    const subscription = createSubscription(PlanType.free());
    const usageRecord = UsageRecord.reconstitute("usage-1", {
      subscriptionId: "sub-1",
      period: "2026-03",
      interviewsUsed: 2,
      analysisTokensUsed: 500,
      storageUsedMb: 10,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(usageRecord);

    const query = new GetUsageQuery("company-123", "2026-03");
    const result = await handler.execute(query);

    expect(result.period).toBe("2026-03");
    expect(result.planType).toBe("free");
    expect(result.usage.interviewsUsed).toBe(2);
    expect(result.usage.interviewsLimit).toBe(3);
    expect(result.usage.analysisTokensUsed).toBe(500);
    expect(result.usage.storageUsedMb).toBe(10);
    expect(result.limits).toEqual({
      interviewsPerMonth: 3,
      maxTemplates: 5,
      maxTeamMembers: 1,
    });
  });

  it("should return zero usage when no usage record exists", async () => {
    const subscription = createSubscription(PlanType.plus());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(null);

    const query = new GetUsageQuery("company-123", "2026-03");
    const result = await handler.execute(query);

    expect(result.usage.interviewsUsed).toBe(0);
    expect(result.usage.analysisTokensUsed).toBe(0);
    expect(result.usage.storageUsedMb).toBe(0);
    expect(result.usage.interviewsLimit).toBe(100);
  });

  it("should default to current period when no period specified", async () => {
    const subscription = createSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(null);

    const now = new Date();
    const expectedPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

    const query = new GetUsageQuery("company-123");
    const result = await handler.execute(query);

    expect(result.period).toBe(expectedPeriod);
  });

  it("should throw SubscriptionNotFoundException when not found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const query = new GetUsageQuery("company-999", "2026-03");

    await expect(handler.execute(query)).rejects.toThrow(
      SubscriptionNotFoundException,
    );
  });

  it("should return unlimited limits for pro plan", async () => {
    const subscription = createSubscription(PlanType.pro());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(null);

    const query = new GetUsageQuery("company-123", "2026-03");
    const result = await handler.execute(query);

    expect(result.limits.interviewsPerMonth).toBe(-1);
    expect(result.limits.maxTemplates).toBe(-1);
    expect(result.limits.maxTeamMembers).toBe(-1);
    expect(result.usage.interviewsLimit).toBe(-1);
  });
});
