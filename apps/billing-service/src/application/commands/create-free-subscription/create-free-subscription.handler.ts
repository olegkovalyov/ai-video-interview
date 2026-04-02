import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { Inject } from "@nestjs/common";
import { v4 as uuid } from "uuid";
import { CreateFreeSubscriptionCommand } from "./create-free-subscription.command";
import { Subscription } from "../../../domain/aggregates/subscription.aggregate";
import type { ISubscriptionRepository } from "../../../domain/repositories/subscription.repository.interface";
import type { IOutboxService } from "../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../interfaces/unit-of-work.interface";
import { LoggerService } from "../../../infrastructure/logger/logger.service";
import { DuplicateSubscriptionException } from "../../../domain/exceptions/billing.exceptions";

@CommandHandler(CreateFreeSubscriptionCommand)
export class CreateFreeSubscriptionHandler
  implements ICommandHandler<CreateFreeSubscriptionCommand>
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

  async execute(command: CreateFreeSubscriptionCommand): Promise<string> {
    const { companyId } = command;

    // Check for duplicate
    const existing = await this.subscriptionRepo.findByCompanyId(companyId);
    if (existing) {
      this.logger.warn(
        `Subscription already exists for company ${companyId}, skipping`,
      );
      return existing.id;
    }

    const subscriptionId = uuid();
    const subscription = Subscription.create(subscriptionId, companyId);

    const eventId = await this.unitOfWork.execute(async (tx) => {
      await this.subscriptionRepo.save(subscription, tx);
      return this.outboxService.saveEvent(
        "subscription.created",
        {
          subscriptionId,
          companyId,
          planType: "free",
        },
        subscriptionId,
        tx,
      );
    });

    await this.outboxService.schedulePublishing([eventId]);

    this.logger.commandLog("CreateFreeSubscription", true, {
      action: "subscription.created",
      companyId,
    } as any);

    return subscriptionId;
  }
}
