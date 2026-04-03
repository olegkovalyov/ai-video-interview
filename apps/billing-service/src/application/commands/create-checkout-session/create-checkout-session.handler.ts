import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CreateCheckoutSessionCommand } from "./create-checkout-session.command";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import type { IStripeService } from "../../interfaces/stripe-service.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";
import {
  SubscriptionNotFoundException,
  InvalidPlanTransitionException,
} from "../../../domain/exceptions/billing.exceptions";
import { PlanType } from "../../../domain/value-objects/plan-type.vo";

@CommandHandler(CreateCheckoutSessionCommand)
export class CreateCheckoutSessionHandler
  implements ICommandHandler<CreateCheckoutSessionCommand>
{
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
    @Inject("IStripeService")
    private readonly stripeService: IStripeService,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    command: CreateCheckoutSessionCommand,
  ): Promise<{ sessionId: string; checkoutUrl: string }> {
    const { companyId, planType, successUrl, cancelUrl } = command;

    const subscription = await this.subscriptionRepo.findByCompanyId(companyId);
    if (!subscription) {
      throw new SubscriptionNotFoundException(companyId);
    }

    // Validate plan transition
    const targetPlan = PlanType.create(planType);
    if (!subscription.planType.canUpgradeTo(targetPlan)) {
      throw new InvalidPlanTransitionException(
        subscription.planType.value,
        planType,
      );
    }

    const result = await this.stripeService.createCheckoutSession({
      companyId,
      planType,
      stripeCustomerId: subscription.stripeCustomerId || undefined,
      successUrl,
      cancelUrl,
    });

    this.logger.commandLog("CreateCheckoutSession", true, {
      action: "checkout.session.created",
      companyId,
      planType,
    } as any);

    return result;
  }
}
