import { IncrementUsageHandler } from "../increment-usage.handler";
import { IncrementUsageCommand } from "../increment-usage.command";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { UsageRecord } from "../../../../domain/entities/usage-record.entity";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";

describe("IncrementUsageHandler", () => {
  let handler: IncrementUsageHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let quotaCache: any;
  let logger: any;

  const createActiveSubscription = () => {
    const now = new Date();
    return Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType: PlanType.plus(),
      status: SubscriptionStatus.active(),
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
      incrementUsage: jest.fn().mockResolvedValue(undefined),
      getQuotaCheck: jest.fn(),
      setQuotaCheck: jest.fn(),
    };

    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    handler = new IncrementUsageHandler(subscriptionRepo, quotaCache, logger);
  });

  it("should atomically increment interview count", async () => {
    const subscription = createActiveSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new IncrementUsageCommand("company-123", "interviews", 1);
    await handler.execute(command);

    expect(subscriptionRepo.incrementUsageAtomic).toHaveBeenCalledWith(
      "sub-1",
      expect.stringMatching(/^\d{4}-\d{2}$/),
      "interviews",
      1,
    );
  });

  it("should atomically increment analysis tokens", async () => {
    const subscription = createActiveSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new IncrementUsageCommand(
      "company-123",
      "analysisTokens",
      1500,
    );
    await handler.execute(command);

    expect(subscriptionRepo.incrementUsageAtomic).toHaveBeenCalledWith(
      "sub-1",
      expect.any(String),
      "analysisTokens",
      1500,
    );
  });

  it("should atomically increment storage", async () => {
    const subscription = createActiveSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new IncrementUsageCommand("company-123", "storage", 50);
    await handler.execute(command);

    expect(subscriptionRepo.incrementUsageAtomic).toHaveBeenCalledWith(
      "sub-1",
      expect.any(String),
      "storage",
      50,
    );
  });

  it("should update Redis cache after incrementing", async () => {
    const subscription = createActiveSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new IncrementUsageCommand("company-123", "interviews", 1);
    await handler.execute(command);

    expect(quotaCache.incrementUsage).toHaveBeenCalledWith(
      "company-123",
      "interviews",
      1,
    );
  });

  it("should skip silently when no subscription found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new IncrementUsageCommand("company-999", "interviews", 1);
    await handler.execute(command);

    expect(subscriptionRepo.saveUsageRecord).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });
});
