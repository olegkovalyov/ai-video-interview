import { ProcessStripeWebhookHandler } from "../process-stripe-webhook.handler";
import { ProcessStripeWebhookCommand } from "../process-stripe-webhook.command";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import { PlanType } from "../../../../domain/value-objects/plan-type.vo";
import { SubscriptionStatus } from "../../../../domain/value-objects/subscription-status.vo";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";
import type { IStripeService } from "../../../interfaces/stripe-service.interface";
import type { IOutboxService } from "../../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../../interfaces/unit-of-work.interface";

describe("ProcessStripeWebhookHandler", () => {
  let handler: ProcessStripeWebhookHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let stripeService: jest.Mocked<IStripeService>;
  let outboxService: jest.Mocked<IOutboxService>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;
  let logger: any;

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const createActiveSubscription = (
    planType: PlanType = PlanType.free(),
    stripeCustomerId: string | null = null,
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
      listInvoices: jest.fn(),
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

    handler = new ProcessStripeWebhookHandler(
      subscriptionRepo,
      stripeService,
      outboxService,
      unitOfWork,
      logger,
    );
  });

  // ─── checkout.session.completed ─────────────────────────────

  it("should upgrade subscription on checkout.session.completed", async () => {
    const subscription = createActiveSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        metadata: { companyId: "company-123", planType: "plus" },
        customer: "cus_new",
        subscription: "sub_stripe_new",
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(subscription.planType.isPlus()).toBe(true);
    expect(subscriptionRepo.save).toHaveBeenCalledWith(
      subscription,
      expect.anything(),
    );
  });

  it("should save payment event and publish via outbox on checkout.session.completed", async () => {
    const subscription = createActiveSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_123",
      type: "checkout.session.completed",
      data: {
        metadata: { companyId: "company-123", planType: "plus" },
        customer: "cus_new",
        subscription: "sub_stripe_new",
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(subscriptionRepo.savePaymentEvent).toHaveBeenCalledWith(
      expect.objectContaining({ stripeEventId: "evt_123" }),
      expect.anything(),
    );
    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "subscription.upgraded",
      expect.objectContaining({
        subscriptionId: "sub-1",
        companyId: "company-123",
      }),
      "sub-1",
      expect.anything(),
    );
    expect(outboxService.schedulePublishing).toHaveBeenCalledWith(["event-1"]);
  });

  it("should use client_reference_id as fallback when metadata.companyId is missing", async () => {
    const subscription = createActiveSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_124",
      type: "checkout.session.completed",
      data: {
        client_reference_id: "company-123",
        metadata: { planType: "plus" },
        customer: "cus_new",
        subscription: "sub_stripe_new",
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(subscriptionRepo.findByCompanyId).toHaveBeenCalledWith(
      "company-123",
    );
    expect(subscription.planType.isPlus()).toBe(true);
  });

  it("should warn and return when checkout session is missing companyId", async () => {
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_125",
      type: "checkout.session.completed",
      data: {
        metadata: {},
        customer: "cus_new",
        subscription: "sub_stripe_new",
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("missing companyId or planType"),
    );
    expect(subscriptionRepo.save).not.toHaveBeenCalled();
  });

  it("should warn and return when subscription not found for checkout", async () => {
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_126",
      type: "checkout.session.completed",
      data: {
        metadata: { companyId: "company-999", planType: "plus" },
        customer: "cus_new",
        subscription: "sub_stripe_new",
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No subscription found for company"),
    );
    expect(subscriptionRepo.save).not.toHaveBeenCalled();
  });

  // ─── invoice.paid ───────────────────────────────────────────

  it("should renew period on invoice.paid", async () => {
    const subscription = createActiveSubscription(PlanType.plus(), "cus_123");
    subscriptionRepo.findByStripeCustomerId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    const periodStartUnix = Math.floor(Date.now() / 1000);
    const periodEndUnix = periodStartUnix + 30 * 24 * 60 * 60;

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_inv_1",
      type: "invoice.paid",
      data: {
        customer: "cus_123",
        period_start: periodStartUnix,
        period_end: periodEndUnix,
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(subscription.status.isActive()).toBe(true);
    expect(subscriptionRepo.save).toHaveBeenCalledWith(
      subscription,
      expect.anything(),
    );
    expect(subscriptionRepo.savePaymentEvent).toHaveBeenCalled();
  });

  it("prefers lines[0].period over top-level invoice period", async () => {
    const subscription = createActiveSubscription(PlanType.plus(), "cus_123");
    subscriptionRepo.findByStripeCustomerId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    // Simulate the real Stripe payload shape for a subscription's first invoice:
    // top-level period collapses to one instant, line items carry the real
    // billing window.
    const instant = 1_700_000_000;
    const lineStart = instant;
    const lineEnd = instant + 30 * 24 * 60 * 60;

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_inv_lines",
      type: "invoice.paid",
      data: {
        customer: "cus_123",
        period_start: instant,
        period_end: instant,
        lines: {
          data: [{ period: { start: lineStart, end: lineEnd } }],
        },
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(subscription.currentPeriodStart.getTime()).toBe(lineStart * 1000);
    expect(subscription.currentPeriodEnd.getTime()).toBe(lineEnd * 1000);
  });

  it("should warn when subscription not found for invoice.paid", async () => {
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);
    subscriptionRepo.findByStripeCustomerId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_inv_2",
      type: "invoice.paid",
      data: { customer: "cus_unknown" },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No subscription found for Stripe customer"),
    );
    expect(subscriptionRepo.save).not.toHaveBeenCalled();
  });

  // ─── invoice.payment_failed ─────────────────────────────────

  it("should mark subscription as past_due on invoice.payment_failed", async () => {
    const subscription = createActiveSubscription(PlanType.plus(), "cus_123");
    subscriptionRepo.findByStripeCustomerId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_fail_1",
      type: "invoice.payment_failed",
      data: { customer: "cus_123" },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(subscription.status.isPastDue()).toBe(true);
    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "subscription.past_due",
      expect.objectContaining({
        subscriptionId: "sub-1",
        companyId: "company-123",
      }),
      "sub-1",
      expect.anything(),
    );
    expect(outboxService.schedulePublishing).toHaveBeenCalledWith(["event-1"]);
  });

  it("should warn when subscription not found for payment_failed", async () => {
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);
    subscriptionRepo.findByStripeCustomerId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_fail_2",
      type: "invoice.payment_failed",
      data: { customer: "cus_unknown" },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No subscription found for Stripe customer"),
    );
  });

  // ─── customer.subscription.deleted ──────────────────────────

  it("should mark subscription as canceled on customer.subscription.deleted", async () => {
    const subscription = createActiveSubscription(PlanType.plus(), "cus_123");
    subscriptionRepo.findByStripeCustomerId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_del_1",
      type: "customer.subscription.deleted",
      data: { customer: "cus_123" },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(subscription.status.isCanceled()).toBe(true);
    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "subscription.canceled",
      expect.objectContaining({
        subscriptionId: "sub-1",
        companyId: "company-123",
      }),
      "sub-1",
      expect.anything(),
    );
    expect(outboxService.schedulePublishing).toHaveBeenCalledWith(["event-1"]);
  });

  it("should warn when subscription not found for subscription.deleted", async () => {
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);
    subscriptionRepo.findByStripeCustomerId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_del_2",
      type: "customer.subscription.deleted",
      data: { customer: "cus_unknown" },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("No subscription found for Stripe customer"),
    );
  });

  // ─── Idempotency ────────────────────────────────────────────

  it("should skip processing when stripe event already processed (idempotency)", async () => {
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue({
      stripeEventId: "evt_dup",
    } as any);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_dup",
      type: "checkout.session.completed",
      data: {},
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("already processed"),
    );
    expect(subscriptionRepo.save).not.toHaveBeenCalled();
    expect(unitOfWork.execute).not.toHaveBeenCalled();
  });

  // ─── Unknown event type ─────────────────────────────────────

  it("should skip unknown event types", async () => {
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_unknown",
      type: "charge.refunded",
      data: {},
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Unhandled Stripe event type"),
    );
    expect(subscriptionRepo.save).not.toHaveBeenCalled();
  });

  // ─── Invalid webhook ────────────────────────────────────────

  it("should throw when stripe webhook construction fails", async () => {
    stripeService.constructWebhookEvent.mockRejectedValue(
      new Error("Invalid signature"),
    );

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "bad_sig",
    );

    await expect(handler.execute(command)).rejects.toThrow("Invalid signature");
  });

  // ─── Logging ────────────────────────────────────────────────

  it("should log success after checkout.session.completed processing", async () => {
    const subscription = createActiveSubscription(PlanType.free());
    subscriptionRepo.findByCompanyId.mockResolvedValue(subscription);
    subscriptionRepo.findPaymentEventByStripeId.mockResolvedValue(null);

    stripeService.constructWebhookEvent.mockResolvedValue({
      id: "evt_log_1",
      type: "checkout.session.completed",
      data: {
        metadata: { companyId: "company-123", planType: "pro" },
        customer: "cus_new",
        subscription: "sub_stripe_new",
      },
    });

    const command = new ProcessStripeWebhookCommand(
      Buffer.from("raw"),
      "sig_123",
    );
    await handler.execute(command);

    expect(logger.commandLog).toHaveBeenCalledWith(
      "ProcessStripeWebhook:checkout.completed",
      true,
      expect.objectContaining({
        action: "subscription.upgraded",
        companyId: "company-123",
        planType: "pro",
      }),
    );
  });
});
