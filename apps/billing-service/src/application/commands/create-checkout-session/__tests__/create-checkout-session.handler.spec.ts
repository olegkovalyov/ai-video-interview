import { CreateCheckoutSessionHandler } from "../create-checkout-session.handler";
import { CreateCheckoutSessionCommand } from "../create-checkout-session.command";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import {
  SubscriptionNotFoundException,
  InvalidPlanTransitionException,
} from "../../../../domain/exceptions/billing.exceptions";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";
import type { IStripeService } from "../../../interfaces/stripe-service.interface";

describe("CreateCheckoutSessionHandler", () => {
  let handler: CreateCheckoutSessionHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let stripeService: jest.Mocked<IStripeService>;
  let logger: any;

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const createSubscription = (
    planType: PlanType = PlanType.free(),
    status: SubscriptionStatus = SubscriptionStatus.active(),
    stripeCustomerId: string | null = null,
  ) => {
    return Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType,
      status,
      stripeCustomerId,
      stripeSubscriptionId: stripeCustomerId ? "sub_stripe_123" : null,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      canceledAt: status.isCanceled() ? now : null,
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

    stripeService = {
      createCheckoutSession: jest.fn().mockResolvedValue({
        sessionId: "cs_123",
        checkoutUrl: "https://checkout.stripe.com/cs_123",
      }),
      createPortalSession: jest.fn(),
      constructWebhookEvent: jest.fn(),
      listInvoices: jest.fn(),
    };

    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    handler = new CreateCheckoutSessionHandler(
      subscriptionRepo,
      stripeService,
      logger,
    );
  });

  it("should create checkout session for free to plus upgrade", async () => {
    const subscription = createSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CreateCheckoutSessionCommand(
      "company-123",
      "plus",
      "https://app.com/success",
      "https://app.com/cancel",
    );
    const result = await handler.execute(command);

    expect(result.sessionId).toBe("cs_123");
    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/cs_123");
  });

  it("should create checkout session for free to pro upgrade", async () => {
    const subscription = createSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CreateCheckoutSessionCommand(
      "company-123",
      "pro",
      "https://app.com/success",
      "https://app.com/cancel",
    );
    const result = await handler.execute(command);

    expect(result.sessionId).toBe("cs_123");
    expect(result.checkoutUrl).toBe("https://checkout.stripe.com/cs_123");
  });

  it("should create checkout session for plus to pro upgrade", async () => {
    const subscription = createSubscription(
      PlanType.plus(),
      SubscriptionStatus.active(),
      "cus_existing",
    );
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CreateCheckoutSessionCommand(
      "company-123",
      "pro",
      "https://app.com/success",
      "https://app.com/cancel",
    );
    const result = await handler.execute(command);

    expect(result.sessionId).toBe("cs_123");
  });

  it("should reject downgrade from pro to plus", async () => {
    const subscription = createSubscription(
      PlanType.pro(),
      SubscriptionStatus.active(),
      "cus_existing",
    );
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CreateCheckoutSessionCommand(
      "company-123",
      "plus",
      "https://app.com/success",
      "https://app.com/cancel",
    );

    await expect(handler.execute(command)).rejects.toThrow(
      InvalidPlanTransitionException,
    );
  });

  it("should reject same plan checkout (already on plus)", async () => {
    const subscription = createSubscription(
      PlanType.plus(),
      SubscriptionStatus.active(),
      "cus_existing",
    );
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CreateCheckoutSessionCommand(
      "company-123",
      "plus",
      "https://app.com/success",
      "https://app.com/cancel",
    );

    await expect(handler.execute(command)).rejects.toThrow(
      InvalidPlanTransitionException,
    );
  });

  it("should throw SubscriptionNotFoundException when not found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new CreateCheckoutSessionCommand(
      "company-999",
      "plus",
      "https://app.com/success",
      "https://app.com/cancel",
    );

    await expect(handler.execute(command)).rejects.toThrow(
      SubscriptionNotFoundException,
    );
  });

  it("should pass existing stripeCustomerId to stripe service", async () => {
    const subscription = createSubscription(
      PlanType.plus(),
      SubscriptionStatus.active(),
      "cus_existing",
    );
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CreateCheckoutSessionCommand(
      "company-123",
      "pro",
      "https://app.com/success",
      "https://app.com/cancel",
    );
    await handler.execute(command);

    expect(stripeService.createCheckoutSession).toHaveBeenCalledWith({
      companyId: "company-123",
      planType: "pro",
      stripeCustomerId: "cus_existing",
      successUrl: "https://app.com/success",
      cancelUrl: "https://app.com/cancel",
    });
  });

  it("should log success after creating checkout session", async () => {
    const subscription = createSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const command = new CreateCheckoutSessionCommand(
      "company-123",
      "plus",
      "https://app.com/success",
      "https://app.com/cancel",
    );
    await handler.execute(command);

    expect(logger.commandLog).toHaveBeenCalledWith(
      "CreateCheckoutSession",
      true,
      expect.objectContaining({
        action: "checkout.session.created",
        companyId: "company-123",
        planType: "plus",
      }),
    );
  });
});
