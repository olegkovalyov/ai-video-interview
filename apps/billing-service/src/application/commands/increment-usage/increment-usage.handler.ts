import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { IncrementUsageCommand } from "./increment-usage.command";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";
import { QuotaCacheService } from "../../../infrastructure/cache/quota-cache.service";

@CommandHandler(IncrementUsageCommand)
export class IncrementUsageHandler
  implements ICommandHandler<IncrementUsageCommand>
{
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
    private readonly quotaCache: QuotaCacheService,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: IncrementUsageCommand): Promise<void> {
    const { companyId, resource, amount } = command;

    const subscription = await this.subscriptionRepo.findByCompanyId(companyId);
    if (!subscription) {
      this.logger.warn(
        `No subscription found for company ${companyId}, skipping usage increment`,
      );
      return;
    }

    const period = this.getCurrentPeriod();

    // Atomic SQL increment — no read-modify-write race condition
    await this.subscriptionRepo.incrementUsageAtomic(
      subscription.id,
      period,
      resource as "interviews" | "analysisTokens" | "storage",
      amount,
    );

    // Update Redis cache (atomic HINCRBY)
    await this.quotaCache.incrementUsage(companyId, resource, amount);

    this.logger.debug(
      `Usage incremented: ${resource} +${amount} for company ${companyId}`,
      {
        action: "usage.incremented",
        companyId,
        resource,
        amount,
      } as any,
    );
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
  }
}
