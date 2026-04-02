import { INestApplication } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedSubscription,
  getCurrentPeriod,
} from "../setup";
import { IncrementUsageCommand } from "../../../src/application/commands/increment-usage/increment-usage.command";
import { UsageRecordEntity } from "../../../src/infrastructure/persistence/entities/usage-record.entity";

describe("IncrementUsageCommand Integration", () => {
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

  it("should create a usage record on first increment", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, { companyId });

    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 1),
    );

    const period = getCurrentPeriod();
    const record = await dataSource
      .getRepository(UsageRecordEntity)
      .findOne({ where: { subscriptionId: subId, period } });

    expect(record).not.toBeNull();
    expect(record!.interviewsUsed).toBe(1);
  });

  it("should accumulate multiple increments correctly", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, { companyId });

    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 1),
    );
    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 1),
    );
    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 3),
    );

    const period = getCurrentPeriod();
    const record = await dataSource
      .getRepository(UsageRecordEntity)
      .findOne({ where: { subscriptionId: subId, period } });

    expect(record).not.toBeNull();
    expect(record!.interviewsUsed).toBe(5);
  });

  it("should handle concurrent increments without lost updates (Promise.all x10)", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, { companyId });

    // Fire 10 concurrent increments of 1 each
    const promises = Array.from({ length: 10 }, () =>
      commandBus.execute(new IncrementUsageCommand(companyId, "interviews", 1)),
    );

    await Promise.all(promises);

    const period = getCurrentPeriod();
    const record = await dataSource
      .getRepository(UsageRecordEntity)
      .findOne({ where: { subscriptionId: subId, period } });

    expect(record).not.toBeNull();
    expect(record!.interviewsUsed).toBe(10);
  });

  it("should increment different resources independently", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, { companyId });

    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 3),
    );
    await commandBus.execute(
      new IncrementUsageCommand(companyId, "analysisTokens", 500),
    );

    const period = getCurrentPeriod();
    const record = await dataSource
      .getRepository(UsageRecordEntity)
      .findOne({ where: { subscriptionId: subId, period } });

    expect(record).not.toBeNull();
    expect(record!.interviewsUsed).toBe(3);
    expect(record!.analysisTokensUsed).toBe(500);
  });

  it("should create separate records for different periods", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, { companyId });

    // Increment for current period
    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 2),
    );

    // Manually insert a record for a different period
    const repo = dataSource.getRepository(UsageRecordEntity);
    await repo.save(
      repo.create({
        subscriptionId: subId,
        period: "2025-01",
        interviewsUsed: 5,
        analysisTokensUsed: 0,
        storageUsedMb: 0,
      }),
    );

    // Verify both periods exist independently
    const currentPeriod = getCurrentPeriod();
    const currentRecord = await repo.findOne({
      where: { subscriptionId: subId, period: currentPeriod },
    });
    const oldRecord = await repo.findOne({
      where: { subscriptionId: subId, period: "2025-01" },
    });

    expect(currentRecord).not.toBeNull();
    expect(currentRecord!.interviewsUsed).toBe(2);
    expect(oldRecord).not.toBeNull();
    expect(oldRecord!.interviewsUsed).toBe(5);
  });

  it("should silently skip when no subscription exists", async () => {
    const companyId = uuidv4();

    // Should not throw
    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 1),
    );

    // Verify no usage records were created
    const count = await dataSource.getRepository(UsageRecordEntity).count();
    expect(count).toBe(0);
  });
});
