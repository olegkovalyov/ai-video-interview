import { CreateFreeSubscriptionHandler } from "../create-free-subscription.handler";
import { CreateFreeSubscriptionCommand } from "../create-free-subscription.command";
import { Subscription } from "../../../../domain/aggregates/subscription.aggregate";
import type { ISubscriptionRepository } from "../../../../domain/repositories/subscription.repository.interface";
import type { IOutboxService } from "../../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../../interfaces/unit-of-work.interface";

describe("CreateFreeSubscriptionHandler", () => {
  let handler: CreateFreeSubscriptionHandler;
  let subscriptionRepo: jest.Mocked<ISubscriptionRepository>;
  let outboxService: jest.Mocked<IOutboxService>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;
  let logger: any;

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

    handler = new CreateFreeSubscriptionHandler(
      subscriptionRepo,
      outboxService,
      unitOfWork,
      logger,
    );
  });

  it("should create a free subscription and return its id", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new CreateFreeSubscriptionCommand("company-123");
    const result = await handler.execute(command);

    expect(result).toBeDefined();
    expect(typeof result).toBe("string");
    expect(subscriptionRepo.findByCompanyId).toHaveBeenCalledWith(
      "company-123",
    );
    expect(subscriptionRepo.save).toHaveBeenCalled();

    const savedSubscription = subscriptionRepo.save.mock
      .calls[0][0] as Subscription;
    expect(savedSubscription.companyId).toBe("company-123");
    expect(savedSubscription.planType.isFree()).toBe(true);
    expect(savedSubscription.status.isActive()).toBe(true);
  });

  it("should publish subscription.created event via outbox", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new CreateFreeSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "subscription.created",
      expect.objectContaining({
        companyId: "company-123",
        planType: "free",
      }),
      expect.any(String),
      expect.anything(),
    );
    expect(outboxService.schedulePublishing).toHaveBeenCalledWith(["event-1"]);
  });

  it("should wrap save + outbox in a unit of work transaction", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new CreateFreeSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(unitOfWork.execute).toHaveBeenCalledTimes(1);
  });

  it("should return existing subscription id when company already has one", async () => {
    const existingSubscription = Subscription.create(
      "existing-sub",
      "company-123",
    );
    subscriptionRepo.findByCompanyId.mockResolvedValue(existingSubscription);

    const command = new CreateFreeSubscriptionCommand("company-123");
    const result = await handler.execute(command);

    expect(result).toBe("existing-sub");
    expect(subscriptionRepo.save).not.toHaveBeenCalled();
    expect(unitOfWork.execute).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it("should log success after creation", async () => {
    subscriptionRepo.findByCompanyId.mockResolvedValue(null);

    const command = new CreateFreeSubscriptionCommand("company-123");
    await handler.execute(command);

    expect(logger.commandLog).toHaveBeenCalledWith(
      "CreateFreeSubscription",
      true,
      expect.objectContaining({
        action: "subscription.created",
        companyId: "company-123",
      }),
    );
  });
});
