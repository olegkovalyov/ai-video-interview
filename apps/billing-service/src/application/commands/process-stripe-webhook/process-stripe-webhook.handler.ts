import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { ProcessStripeWebhookCommand } from "./process-stripe-webhook.command";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import type { IStripeService } from "../../interfaces/stripe-service.interface";
import type { IOutboxService } from "../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../interfaces/unit-of-work.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";
import { PaymentEvent } from "../../../domain/entities/payment-event.entity";
import { PlanType } from "../../../domain/value-objects/plan-type.vo";

@CommandHandler(ProcessStripeWebhookCommand)
export class ProcessStripeWebhookHandler
  implements ICommandHandler<ProcessStripeWebhookCommand>
{
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
    @Inject("IStripeService")
    private readonly stripeService: IStripeService,
    @Inject("IOutboxService")
    private readonly outboxService: IOutboxService,
    @Inject("IUnitOfWork")
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: ProcessStripeWebhookCommand): Promise<void> {
    const event = await this.stripeService.constructWebhookEvent(
      command.rawBody,
      command.signature,
    );

    // Idempotency check
    const existingEvent =
      await this.subscriptionRepo.findPaymentEventByStripeId(event.id);
    if (existingEvent) {
      this.logger.info(`Stripe event ${event.id} already processed, skipping`);
      return;
    }

    this.logger.info(`Processing Stripe webhook: ${event.type} (${event.id})`);

    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(event);
        break;
      case "invoice.paid":
        await this.handleInvoicePaid(event);
        break;
      case "invoice.payment_failed":
        await this.handlePaymentFailed(event);
        break;
      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event);
        break;
      default:
        this.logger.info(`Unhandled Stripe event type: ${event.type}`);
    }
  }

  private async handleCheckoutCompleted(event: {
    id: string;
    type: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    const session = event.data as any;
    const companyId =
      session.metadata?.companyId || session.client_reference_id;
    const planType = session.metadata?.planType;
    const stripeCustomerId = session.customer;
    const stripeSubscriptionId = session.subscription;

    if (!companyId || !planType) {
      this.logger.warn(
        "Checkout session missing companyId or planType metadata",
      );
      return;
    }

    const subscription = await this.subscriptionRepo.findByCompanyId(companyId);
    if (!subscription) {
      this.logger.warn(`No subscription found for company ${companyId}`);
      return;
    }

    const newPlan = PlanType.create(planType);
    const now = new Date();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    subscription.upgrade(
      newPlan,
      stripeCustomerId,
      stripeSubscriptionId,
      now,
      periodEnd,
    );

    const paymentEvent = PaymentEvent.create(
      uuid(),
      event.id,
      event.type,
      event.data,
    );

    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.subscriptionRepo.save(subscription, tx);
      await this.subscriptionRepo.savePaymentEvent(paymentEvent, tx);
      return this.outboxService.saveEvent(
        "subscription.upgraded",
        {
          subscriptionId: subscription.id,
          companyId,
          previousPlan: subscription.planType.value,
          newPlan: planType,
          stripeSubscriptionId,
        },
        subscription.id,
        tx,
      );
    });

    await this.outboxService.schedulePublishing([eventId]);

    this.logger.commandLog("ProcessStripeWebhook:checkout.completed", true, {
      action: "subscription.upgraded",
      companyId,
      planType,
    } as any);
  }

  private async handleInvoicePaid(event: {
    id: string;
    type: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    const invoice = event.data as any;
    const stripeCustomerId = invoice.customer;

    const subscription =
      await this.subscriptionRepo.findByStripeCustomerId(stripeCustomerId);
    if (!subscription) {
      this.logger.warn(
        `No subscription found for Stripe customer ${stripeCustomerId}`,
      );
      return;
    }

    const periodStart = new Date(
      (invoice.period_start || Math.floor(Date.now() / 1000)) * 1000,
    );
    const periodEnd = new Date(
      (invoice.period_end ||
        Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60) * 1000,
    );

    subscription.renewPeriod(periodStart, periodEnd);

    const paymentEvent = PaymentEvent.create(
      uuid(),
      event.id,
      event.type,
      event.data,
    );

    await this.unitOfWork.execute(async (tx) => {
      await this.subscriptionRepo.save(subscription, tx);
      await this.subscriptionRepo.savePaymentEvent(paymentEvent, tx);
    });

    this.logger.commandLog("ProcessStripeWebhook:invoice.paid", true, {
      action: "subscription.renewed",
      companyId: subscription.companyId,
    } as any);
  }

  private async handlePaymentFailed(event: {
    id: string;
    type: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    const invoice = event.data as any;
    const stripeCustomerId = invoice.customer;

    const subscription =
      await this.subscriptionRepo.findByStripeCustomerId(stripeCustomerId);
    if (!subscription) {
      this.logger.warn(
        `No subscription found for Stripe customer ${stripeCustomerId}`,
      );
      return;
    }

    subscription.markPastDue();

    const paymentEvent = PaymentEvent.create(
      uuid(),
      event.id,
      event.type,
      event.data,
    );

    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.subscriptionRepo.save(subscription, tx);
      await this.subscriptionRepo.savePaymentEvent(paymentEvent, tx);
      return this.outboxService.saveEvent(
        "subscription.past_due",
        {
          subscriptionId: subscription.id,
          companyId: subscription.companyId,
          planType: subscription.planType.value,
        },
        subscription.id,
        tx,
      );
    });

    await this.outboxService.schedulePublishing([eventId]);

    this.logger.commandLog(
      "ProcessStripeWebhook:invoice.payment_failed",
      true,
      {
        action: "subscription.past_due",
        companyId: subscription.companyId,
      } as any,
    );
  }

  private async handleSubscriptionDeleted(event: {
    id: string;
    type: string;
    data: Record<string, unknown>;
  }): Promise<void> {
    const stripeSubscription = event.data as any;
    const stripeCustomerId = stripeSubscription.customer;

    const subscription =
      await this.subscriptionRepo.findByStripeCustomerId(stripeCustomerId);
    if (!subscription) {
      this.logger.warn(
        `No subscription found for Stripe customer ${stripeCustomerId}`,
      );
      return;
    }

    subscription.markCanceled();

    const paymentEvent = PaymentEvent.create(
      uuid(),
      event.id,
      event.type,
      event.data,
    );

    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.subscriptionRepo.save(subscription, tx);
      await this.subscriptionRepo.savePaymentEvent(paymentEvent, tx);
      return this.outboxService.saveEvent(
        "subscription.canceled",
        {
          subscriptionId: subscription.id,
          companyId: subscription.companyId,
          planType: subscription.planType.value,
        },
        subscription.id,
        tx,
      );
    });

    await this.outboxService.schedulePublishing([eventId]);

    this.logger.commandLog("ProcessStripeWebhook:subscription.deleted", true, {
      action: "subscription.canceled",
      companyId: subscription.companyId,
    } as any);
  }
}
