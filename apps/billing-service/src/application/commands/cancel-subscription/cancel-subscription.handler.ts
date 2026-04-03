import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { CancelSubscriptionCommand } from "./cancel-subscription.command";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import type { IOutboxService } from "../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../interfaces/unit-of-work.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";
import { SubscriptionNotFoundException } from "../../../domain/exceptions/billing.exceptions";

@CommandHandler(CancelSubscriptionCommand)
export class CancelSubscriptionHandler
  implements ICommandHandler<CancelSubscriptionCommand>
{
  constructor(
    @Inject("ISubscriptionRepository")
    private readonly subscriptionRepo: ISubscriptionRepository,
    @Inject("IOutboxService")
    private readonly outboxService: IOutboxService,
    @Inject("IUnitOfWork")
    private readonly unitOfWork: IUnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(command: CancelSubscriptionCommand): Promise<void> {
    const subscription = await this.subscriptionRepo.findByCompanyId(
      command.companyId,
    );
    if (!subscription) {
      throw new SubscriptionNotFoundException(command.companyId);
    }

    subscription.cancel();

    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.subscriptionRepo.save(subscription, tx);
      return this.outboxService.saveEvent(
        "subscription.canceled",
        {
          subscriptionId: subscription.id,
          companyId: subscription.companyId,
          planType: subscription.planType.value,
          cancelAtPeriodEnd: true,
        },
        subscription.id,
        tx,
      );
    });

    await this.outboxService.schedulePublishing([eventId]);

    this.logger.commandLog("CancelSubscription", true, {
      action: "subscription.canceled",
      companyId: command.companyId,
    } as any);
  }
}
