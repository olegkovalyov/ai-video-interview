import { CheckQuotaHandler } from "../check-quota.handler";
import { CheckQuotaQuery } from "../check-quota.query";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { UsageRecord } from "../../../../domain/entities/usage-record.entity";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";

describe("CheckQuotaHandler", () => {
  let handler: CheckQuotaHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let quotaCache: any;

  const createSubscription = (planType: PlanType = PlanType.free()) => {
    const now = new Date();
    return Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType,
      status: SubscriptionStatus.active(),
      stripeCustomerId: planType.isFree() ? null : "cus_123",
      stripeSubscriptionId: planType.isFree() ? null : "sub_stripe_123",
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

    quotaCache = {
      incrementUsage: jest.fn(),
      getQuotaCheck: jest.fn().mockResolvedValue(null),
      setQuotaCheck: jest.fn().mockResolvedValue(undefined),
    };

    handler = new CheckQuotaHandler(subscriptionRepo, quotaCache);
  });

  it("should return allowed=true when under limit (free plan, 2/3 interviews)", async () => {
    const subscription = createSubscription(PlanType.free());
    const usageRecord = UsageRecord.reconstitute("usage-1", {
      subscriptionId: "sub-1",
      period: "2026-03",
      interviewsUsed: 2,
      analysisTokensUsed: 0,
      storageUsedMb: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(usageRecord);

    const query = new CheckQuotaQuery("company-123", "interviews");
    const result = await handler.execute(query);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(1);
    expect(result.limit).toBe(3);
    expect(result.currentPlan).toBe("free");
  });

  it("should return allowed=false when at limit (free plan, 3/3 interviews)", async () => {
    const subscription = createSubscription(PlanType.free());
    const usageRecord = UsageRecord.reconstitute("usage-1", {
      subscriptionId: "sub-1",
      period: "2026-03",
      interviewsUsed: 3,
      analysisTokensUsed: 0,
      storageUsedMb: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(usageRecord);

    const query = new CheckQuotaQuery("company-123", "interviews");
    const result = await handler.execute(query);

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(3);
  });

  it("should return allowed=true for unlimited (-1) pro plan", async () => {
    const subscription = createSubscription(PlanType.pro());
    const usageRecord = UsageRecord.reconstitute("usage-1", {
      subscriptionId: "sub-1",
      period: "2026-03",
      interviewsUsed: 999,
      analysisTokensUsed: 0,
      storageUsedMb: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(usageRecord);

    const query = new CheckQuotaQuery("company-123", "interviews");
    const result = await handler.execute(query);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(-1);
    expect(result.limit).toBe(-1);
    expect(result.currentPlan).toBe("pro");
  });

  it("should return cached result when Redis cache hit", async () => {
    const cachedResult = {
      allowed: true,
      remaining: 2,
      limit: 3,
      currentPlan: "free",
    };
    quotaCache.getQuotaCheck.mockResolvedValue(cachedResult);

    const query = new CheckQuotaQuery("company-123", "interviews");
    const result = await handler.execute(query);

    expect(result).toEqual(cachedResult);
    expect(subscriptionRepo.findByCompanyId).not.toHaveBeenCalled();
  });

  it("should fall back to DB when Redis cache miss", async () => {
    quotaCache.getQuotaCheck.mockResolvedValue(null);

    const subscription = createSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(null);

    const query = new CheckQuotaQuery("company-123", "interviews");
    const result = await handler.execute(query);

    expect(subscriptionRepo.findByCompanyId).toHaveBeenCalledWith(
      "company-123",
    );
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3);
    expect(result.limit).toBe(3);
  });

  it("should cache the DB result in Redis", async () => {
    quotaCache.getQuotaCheck.mockResolvedValue(null);

    const subscription = createSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(null);

    const query = new CheckQuotaQuery("company-123", "interviews");
    await handler.execute(query);

    expect(quotaCache.setQuotaCheck).toHaveBeenCalledWith(
      "company-123",
      "interviews",
      expect.objectContaining({
        allowed: true,
        limit: 3,
        currentPlan: "free",
      }),
    );
  });

  it("should return free plan defaults when no subscription found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const query = new CheckQuotaQuery("company-999", "interviews");
    const result = await handler.execute(query);

    expect(result.allowed).toBe(true);
    expect(result.limit).toBe(3);
    expect(result.currentPlan).toBe("free");
  });

  it("should handle zero usage (no usage record)", async () => {
    const subscription = createSubscription(PlanType.plus());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findUsageRecord.mockResolvedValue(null);

    const query = new CheckQuotaQuery("company-123", "interviews");
    const result = await handler.execute(query);

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(100);
    expect(result.limit).toBe(100);
    expect(result.currentPlan).toBe("plus");
  });
});
