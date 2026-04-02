import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { ResumeSubscriptionCommand } from "./resume-subscription.command";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import type { IUnitOfWork } from "../../interfaces/unit-of-work.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";
import { SubscriptionNotFoundException } from "../../../domain/exceptions/billing.exceptions";

@CommandHandler(ResumeSubscriptionCommand)
export class ResumeSubscriptionHandler
  implements ICommandHandler<ResumeSubscriptionCommand>
{
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
    @Inject("IUnitOfWork")
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: ResumeSubscriptionCommand): Promise<void> {
    const subscription = await this.subscriptionRepo.findByCompanyId(
      command.companyId,
    );
    if (!subscription) {
      throw new SubscriptionNotFoundException(command.companyId);
    }

    subscription.resume();

    await this.unitOfWork.execute(async (tx) => {
      await this.subscriptionRepo.save(subscription, tx);
    });

    this.logger.commandLog("ResumeSubscription", true, {
      action: "subscription.resumed",
      companyId: command.companyId,
    } as any);
  }
}
