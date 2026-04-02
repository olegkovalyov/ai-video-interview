import { INestApplication } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { setupTestApp, createTestDataSource, cleanDatabase } from "../setup";
import { CreateFreeSubscriptionCommand } from "../../../src/application/commands/create-free-subscription/create-free-subscription.command";
import { SubscriptionEntity } from "../../../src/infrastructure/persistence/entities/subscription.entity";
import { OutboxEntity } from "../../../src/infrastructure/persistence/entities/outbox.entity";
import { mockOutboxService } from "../test-application.module";

describe("CreateFreeSubscriptionCommand Integration", () => {
  let app: INestApplication;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    commandBus = app.get(CommandBus);
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it("should create a FREE subscription for a new company", async () => {
    const companyId = uuidv4();

    const subscriptionId = await commandBus.execute(
      new CreateFreeSubscriptionCommand(companyId),
    );

    expect(subscriptionId).toBeDefined();
    expect(typeof subscriptionId).toBe("string");

    // Verify DB state
    const entity = await dataSource
      .getRepository(SubscriptionEntity)
      .findOne({ where: { id: subscriptionId } });

    expect(entity).not.toBeNull();
    expect(entity!.companyId).toBe(companyId);
    expect(entity!.planType).toBe("free");
    expect(entity!.status).toBe("active");
    expect(entity!.stripeCustomerId).toBeNull();
    expect(entity!.stripeSubscriptionId).toBeNull();
    expect(entity!.cancelAtPeriodEnd).toBe(false);
    expect(entity!.canceledAt).toBeNull();
  });

  it("should have correct default period dates (30 days)", async () => {
    const companyId = uuidv4();
    const beforeCreation = Date.now();

    const subscriptionId = await commandBus.execute(
      new CreateFreeSubscriptionCommand(companyId),
    );

    const entity = await dataSource
      .getRepository(SubscriptionEntity)
      .findOne({ where: { id: subscriptionId } });

    expect(entity).not.toBeNull();

    const periodStart = entity!.currentPeriodStart.getTime();
    const periodEnd = entity!.currentPeriodEnd.getTime();

    // Period start should be roughly now
    expect(periodStart).toBeGreaterThanOrEqual(beforeCreation - 1000);
    expect(periodStart).toBeLessThanOrEqual(Date.now() + 1000);

    // Period end should be ~30 days from start
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const periodDuration = periodEnd - periodStart;
    expect(periodDuration).toBeGreaterThanOrEqual(thirtyDaysMs - 1000);
    expect(periodDuration).toBeLessThanOrEqual(thirtyDaysMs + 1000);
  });

  it("should save outbox event in the same transaction", async () => {
    const companyId = uuidv4();

    await commandBus.execute(new CreateFreeSubscriptionCommand(companyId));

    // Verify outbox event was saved via mock
    expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
      "subscription.created",
      expect.objectContaining({
        companyId,
        planType: "free",
      }),
      expect.any(String), // subscriptionId
      expect.anything(), // tx (EntityManager)
    );

    expect(mockOutboxService.schedulePublishing).toHaveBeenCalledWith([
      "mock-event-id",
    ]);
  });

  it("should return existing subscription ID for duplicate companyId (idempotent)", async () => {
    const companyId = uuidv4();

    const firstId = await commandBus.execute(
      new CreateFreeSubscriptionCommand(companyId),
    );
    const secondId = await commandBus.execute(
      new CreateFreeSubscriptionCommand(companyId),
    );

    expect(secondId).toBe(firstId);

    // Verify only one subscription exists
    const count = await dataSource
      .getRepository(SubscriptionEntity)
      .count({ where: { companyId } });
    expect(count).toBe(1);
  });

  it("should verify full DB state after creation", async () => {
    const companyId = uuidv4();

    const subscriptionId = await commandBus.execute(
      new CreateFreeSubscriptionCommand(companyId),
    );

    const entity = await dataSource
      .getRepository(SubscriptionEntity)
      .findOne({ where: { id: subscriptionId } });

    expect(entity).not.toBeNull();
    expect(entity!.id).toBe(subscriptionId);
    expect(entity!.companyId).toBe(companyId);
    expect(entity!.planType).toBe("free");
    expect(entity!.status).toBe("active");
    expect(entity!.stripeCustomerId).toBeNull();
    expect(entity!.stripeSubscriptionId).toBeNull();
    expect(entity!.cancelAtPeriodEnd).toBe(false);
    expect(entity!.canceledAt).toBeNull();
    expect(entity!.trialEnd).toBeNull();
    expect(entity!.version).toBe(1);
    expect(entity!.createdAt).toBeInstanceOf(Date);
    expect(entity!.updatedAt).toBeInstanceOf(Date);
  });
});
