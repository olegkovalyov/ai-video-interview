import { CancelSubscriptionHandler } from "../cancel-subscription.handler";
import { CancelSubscriptionCommand } from "../cancel-subscription.command";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import { SubscriptionNotFoundException } from "../../../../domain/exceptions/billing.exceptions";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";
import type { IOutboxService } from "../../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../../interfaces/unit-of-work.interface";

describe("CancelSubscriptionHandler", () => {
  let handler: CancelSubscriptionHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let outboxService: jest.Mocked<IOutboxService>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;
  let logger: any;

  const createActiveSubscription = (companyId = "company-123") => {
    const now = new Date();
    return Subscription.reconstitute("sub-1", {
      companyId,
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

    outboxService = {
      saveEvent: jest.fn().mockResolvedValue("event-1"),
      saveEvents: jest.fn(),
      schedulePublishing: jest.fn().mockResolvedValue(undefined),
    };

    unitOfWork = {
      execute: jest.fn().mockImplementation(async (work) => work({})),
    };

    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    handler = new CancelSubscriptionHandler(
      subscriptionRepo,
      outboxService,
      unitOfWork,
      logger,
    );
  });

  it("should mark cancelAtPeriodEnd and save subscription", async () => {
    const subscription = createActiveSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CancelSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(subscription.cancelAtPeriodEnd).toBe(true);
    expect(subscription.canceledAt).toBeInstanceOf(Date);
    expect(subscriptionRepo.save).toHaveBeenCalledWith(
      subscription,
      expect.anything(),
    );
  });

  it("should publish subscription.canceled event via outbox", async () => {
    const subscription = createActiveSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CancelSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "subscription.canceled",
      expect.objectContaining({
        subscriptionId: "sub-1",
        companyId: "company-123",
        planType: "plus",
        cancelAtPeriodEnd: true,
      }),
      "sub-1",
      expect.anything(),
    );
    expect(outboxService.schedulePublishing).toHaveBeenCalledWith(["event-1"]);
  });

  it("should throw SubscriptionNotFoundException when not found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new CancelSubscriptionCommand("company-999");

    await expect(handler.execute(command)).rejects.toThrow(
      SubscriptionNotFoundException,
    );
  });

  it("should throw when subscription is already canceled", async () => {
    const now = new Date();
    const subscription = Subscription.reconstitute("sub-1", {
      companyId: "company-123",
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
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CancelSubscriptionCommand("company-123");

    await expect(handler.execute(command)).rejects.toThrow();
  });

  it("should log success after cancellation", async () => {
    const subscription = createActiveSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CancelSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(logger.commandLog).toHaveBeenCalledWith(
      "CancelSubscription",
      true,
      expect.objectContaining({
        action: "subscription.canceled",
        companyId: "company-123",
      }),
    );
  });
});
