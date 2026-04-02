import { QueryHandler, IQueryHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CheckQuotaQuery } from "./check-quota.query";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import { QuotaCacheService } from "../../../infrastructure/cache/quota-cache.service";
import { PLANS } from "../../../config/plans.config";
import type { PlanTypeValue } from "../../../domain/value-objects/plan-type.vo";

@QueryHandler(CheckQuotaQuery)
export class CheckQuotaHandler implements IQueryHandler<CheckQuotaQuery> {
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly quotaCache: QuotaCacheService,
  ) {}

  async execute(query: CheckQuotaQuery) {
    const { companyId, resource } = query;

    // Try Redis cache first
    const cached = await this.quotaCache.getQuotaCheck(companyId, resource);
    if (cached) {
      return cached;
    }

    // Fall back to DB
    const subscription = await this.subscriptionRepo.findByCompanyId(companyId);
    if (!subscription) {
      // No subscription = free plan defaults
      const freePlan = PLANS.free;
      const limit = this.getLimitForResource(freePlan.limits, resource);
      const result = {
        allowed: true,
        remaining: limit,
        limit,
        currentPlan: "free",
      };
      await this.quotaCache.setQuotaCheck(companyId, resource, result);
      return result;
    }

    const planConfig = PLANS[subscription.planType.value as PlanTypeValue];
    const limit = this.getLimitForResource(planConfig.limits, resource);

    // Get current usage
    const period = this.getCurrentPeriod();
    const usageRecord = await this.subscriptionRepo.findUsageRecord(
      subscription.id,
      period,
    );
    const currentUsage = this.getUsageForResource(usageRecord, resource);

    const isUnlimited = limit === -1;
    const allowed = isUnlimited || currentUsage < limit;
    const remaining = isUnlimited ? -1 : Math.max(0, limit - currentUsage);

    const result = {
      allowed,
      remaining,
      limit,
      currentPlan: subscription.planType.value,
    };

    await this.quotaCache.setQuotaCheck(companyId, resource, result);
    return result;
  }

  private getLimitForResource(
    limits: {
      interviewsPerMonth: number;
      maxTemplates: number;
      maxTeamMembers: number;
    },
    resource: string,
  ): number {
    switch (resource) {
      case "interviews":
        return limits.interviewsPerMonth;
      case "templates":
        return limits.maxTemplates;
      case "teamMembers":
        return limits.maxTeamMembers;
      default:
        return 0;
    }
  }

  private getUsageForResource(usageRecord: any, resource: string): number {
    if (!usageRecord) return 0;
    switch (resource) {
      case "interviews":
        return usageRecord.interviewsUsed || 0;
      default:
        return 0;
    }
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
}
