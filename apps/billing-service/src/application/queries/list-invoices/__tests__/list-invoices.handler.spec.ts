import { ListInvoicesHandler } from "../list-invoices.handler";
import { ListInvoicesQuery } from "../list-invoices.query";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import { SubscriptionNotFoundException } from "../../../../domain/exceptions/billing.exceptions";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";
import type { IStripeService } from "../../../interfaces/stripe-service.interface";

describe("ListInvoicesHandler", () => {
  let handler: ListInvoicesHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let stripeService: jest.Mocked<IStripeService>;
  let cache: any;

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const createSubscription = (
    planType: PlanType = PlanType.plus(),
    stripeCustomerId: string | null = "cus_123",
  ) => {
    return Subscription.reconstitute("sub-1", {
      companyId: "company-123",
      planType,
      status: SubscriptionStatus.active(),
      stripeCustomerId,
      stripeSubscriptionId: stripeCustomerId ? "sub_stripe_123" : null,
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

  const sampleInvoices = [
    {
      id: "inv_1",
      number: "INV-001",
      status: "paid",
      amountDue: 2900,
      amountPaid: 2900,
      currency: "usd",
      periodStart: 1700000000,
      periodEnd: 1702592000,
      hostedInvoiceUrl: "https://stripe.com/inv/1",
      pdfUrl: "https://stripe.com/inv/1/pdf",
      createdAt: 1700000000,
    },
  ];

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
      createCheckoutSession: jest.fn(),
      createPortalSession: jest.fn(),
      constructWebhookEvent: jest.fn(),
      listInvoices: jest.fn().mockResolvedValue(sampleInvoices),
    };

    cache = {
      getInvoices: jest.fn().mockResolvedValue(null),
      setInvoices: jest.fn().mockResolvedValue(undefined),
      getQuotaCheck: jest.fn(),
      setQuotaCheck: jest.fn(),
      incrementUsage: jest.fn(),
      getSubscription: jest.fn(),
      setSubscription: jest.fn(),
      invalidateSubscription: jest.fn(),
    };

    handler = new ListInvoicesHandler(subscriptionRepo, stripeService, cache);
  });

  it("should return cached invoices on cache hit", async () => {
    const subscription = createSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    cache.getInvoices.mockResolvedValue(sampleInvoices);

    const query = new ListInvoicesQuery("company-123");
    const result = await handler.execute(query);

    expect(result).toEqual(sampleInvoices);
    expect(stripeService.listInvoices).not.toHaveBeenCalled();
  });

  it("should call Stripe API on cache miss and cache the result", async () => {
    const subscription = createSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    cache.getInvoices.mockResolvedValue(null);

    const query = new ListInvoicesQuery("company-123");
    const result = await handler.execute(query);

    expect(result).toEqual(sampleInvoices);
    expect(stripeService.listInvoices).toHaveBeenCalledWith("cus_123", 10);
    expect(cache.setInvoices).toHaveBeenCalledWith("cus_123", sampleInvoices);
  });

  it("should return empty array for free plan (no stripeCustomerId)", async () => {
    const subscription = createSubscription(PlanType.free(), null);
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);

    const query = new ListInvoicesQuery("company-123");
    const result = await handler.execute(query);

    expect(result).toEqual([]);
    expect(stripeService.listInvoices).not.toHaveBeenCalled();
  });

  it("should throw SubscriptionNotFoundException when not found", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const query = new ListInvoicesQuery("company-999");

    await expect(handler.execute(query)).rejects.toThrow(
      SubscriptionNotFoundException,
    );
  });

  it("should pass custom limit parameter to Stripe", async () => {
    const subscription = createSubscription();
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    cache.getInvoices.mockResolvedValue(null);

    const query = new ListInvoicesQuery("company-123", 25);
    await handler.execute(query);

    expect(stripeService.listInvoices).toHaveBeenCalledWith("cus_123", 25);
  });
});
