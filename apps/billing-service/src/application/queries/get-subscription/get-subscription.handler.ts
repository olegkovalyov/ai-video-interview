import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetSubscriptionQuery } from "./get-subscription.query";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import { SubscriptionNotFoundException } from "../../../domain/exceptions/billing.exceptions";
import { PLANS } from "../../../config/plans.config";
import type { PlanTypeValue } from "../../../domain/value-objects/plan-type.vo";

@QueryHandler(GetSubscriptionQuery)
export class GetSubscriptionHandler
  implements IQueryHandler<GetSubscriptionQuery>
{
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
  ) {}

  async execute(query: GetSubscriptionQuery) {
    const subscription = await this.subscriptionRepo.findByCompanyId(
      query.companyId,
    );
    if (!subscription) {
      throw new SubscriptionNotFoundException(query.companyId);
    }

    const planConfig = PLANS[subscription.planType.value as PlanTypeValue];

    return {
      id: subscription.id,
      companyId: subscription.companyId,
      planType: subscription.planType.value,
      planName: planConfig.name,
      status: subscription.status.value,
      limits: planConfig.limits,
      features: planConfig.features,
      stripeCustomerId: subscription.stripeCustomerId,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      canceledAt: subscription.canceledAt?.toISOString() || null,
      trialEnd: subscription.trialEnd?.toISOString() || null,
      createdAt: subscription.createdAt.toISOString(),
    };
  }
}
