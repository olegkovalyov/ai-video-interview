import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { GetUsageQuery } from "./get-usage.query";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import { SubscriptionNotFoundException } from "../../../domain/exceptions/billing.exceptions";
import { PLANS } from "../../../config/plans.config";
import type { PlanTypeValue } from "../../../domain/value-objects/plan-type.vo";

@QueryHandler(GetUsageQuery)
export class GetUsageHandler implements IQueryHandler<GetUsageQuery> {
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
  ) {}

  async execute(query: GetUsageQuery) {
    const subscription = await this.subscriptionRepo.findByCompanyId(
      query.companyId,
    );
    if (!subscription) {
      throw new SubscriptionNotFoundException(query.companyId);
    }

    const period = query.period || this.getCurrentPeriod();
    const usageRecord = await this.subscriptionRepo.findUsageRecord(
      subscription.id,
      period,
    );

    const planConfig = PLANS[subscription.planType.value as PlanTypeValue];
    const limits = planConfig.limits;

    return {
      period,
      planType: subscription.planType.value,
      usage: {
        interviewsUsed: usageRecord?.interviewsUsed || 0,
        interviewsLimit: limits.interviewsPerMonth,
        analysisTokensUsed: usageRecord?.analysisTokensUsed || 0,
        storageUsedMb: usageRecord?.storageUsedMb || 0,
      },
      limits,
    };
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
}
