import { ResumeSubscriptionHandler } from "../resume-subscription.handler";
import { ResumeSubscriptionCommand } from "../resume-subscription.command";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import {
  SubscriptionNotFoundException,
  InvalidSubscriptionStateException,
} from "../../../../domain/exceptions/billing.exceptions";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";
import type { IUnitOfWork } from "../../../interfaces/unit-of-work.interface";

describe("ResumeSubscriptionHandler", () => {
  let handler: ResumeSubscriptionHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;
  let logger: any;

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const createCancelingSubscription = () => {
    return Subscription.reconstitute("sub-1", {
      companyId: "company-123",
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

    handler = new ResumeSubscriptionHandler(
      subscriptionRepo,
      unitOfWork,
      logger,
    );
  });

  it("should resume a canceling subscription (cancelAtPeriodEnd → false)", async () => {
    const subscription = createCancelingSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new ResumeSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(subscription.cancelAtPeriodEnd).toBe(false);
    expect(subscription.canceledAt).toBeNull();
    expect(subscriptionRepo.save).toHaveBeenCalledWith(
      subscription,
      expect.anything(),
    );
  });

  it("should throw SubscriptionNotFoundException when not found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new ResumeSubscriptionCommand("company-999");

    await expect(handler.execute(command)).rejects.toThrow(
      SubscriptionNotFoundException,
    );
  });

  it("should throw when subscription is not scheduled for cancellation", async () => {
    const subscription = Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType: PlanType.plus(),
      status: SubscriptionStatus.active(),
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_stripe_123",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: null,
      trialEnd: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new ResumeSubscriptionCommand("company-123");

    await expect(handler.execute(command)).rejects.toThrow(
      InvalidSubscriptionStateException,
    );
  });

  it("should throw when subscription is already canceled (terminal)", async () => {
    const subscription = Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType: PlanType.plus(),
      status: SubscriptionStatus.canceled(),
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_stripe_123",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: true,
      canceledAt: now,
      trialEnd: null,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new ResumeSubscriptionCommand("company-123");

    await expect(handler.execute(command)).rejects.toThrow(
      InvalidSubscriptionStateException,
    );
  });

  it("should log success after resuming subscription", async () => {
    const subscription = createCancelingSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new ResumeSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(logger.commandLog).toHaveBeenCalledWith(
      "ResumeSubscription",
      true,
      expect.objectContaining({
        action: "subscription.resumed",
        companyId: "company-123",
      }),
    );
  });
});
