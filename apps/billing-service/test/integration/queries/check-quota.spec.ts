import { INestApplication } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedSubscription,
  seedUsageRecord,
  getCurrentPeriod,
} from "../setup";
import { CheckQuotaQuery } from "../../../src/application/queries/check-quota/check-quota.query";
import { IncrementUsageCommand } from "../../../src/application/commands/increment-usage/increment-usage.command";
import { CommandBus } from "@nestjs/cqrs";

describe("CheckQuotaQuery Integration", () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let commandBus: CommandBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
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

  it("should return allowed=true with remaining quota when under limit", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, {
      companyId,
      planType: "free",
    });

    // Seed 1 interview used (free plan limit is 3)
    await seedUsageRecord(dataSource, {
      subscriptionId: subId,
      period: getCurrentPeriod(),
      interviewsUsed: 1,
    });

    const result = await queryBus.execute(
      new CheckQuotaQuery(companyId, "interviews"),
    );

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2); // 3 - 1 = 2
    expect(result.limit).toBe(3);
    expect(result.currentPlan).toBe("free");
  });

  it("should return allowed=false with remaining=0 when at limit", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, {
      companyId,
      planType: "free",
    });

    // Seed 3 interviews used (free plan limit is 3)
    await seedUsageRecord(dataSource, {
      subscriptionId: subId,
      period: getCurrentPeriod(),
      interviewsUsed: 3,
    });

    const result = await queryBus.execute(
      new CheckQuotaQuery(companyId, "interviews"),
    );

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.limit).toBe(3);
    expect(result.currentPlan).toBe("free");
  });

  it("should return unlimited quota for pro plan (remaining=-1)", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, {
      companyId,
      planType: "pro",
      stripeCustomerId: "cus_pro123",
      stripeSubscriptionId: "sub_pro123",
    });

    // Even with high usage, pro plan is unlimited
    await seedUsageRecord(dataSource, {
      subscriptionId: subId,
      period: getCurrentPeriod(),
      interviewsUsed: 9999,
    });

    const result = await queryBus.execute(
      new CheckQuotaQuery(companyId, "interviews"),
    );

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(-1); // Unlimited
    expect(result.limit).toBe(-1);
    expect(result.currentPlan).toBe("pro");
  });

  it("should return free plan defaults when no subscription exists", async () => {
    const companyId = uuidv4();

    const result = await queryBus.execute(
      new CheckQuotaQuery(companyId, "interviews"),
    );

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(3); // Free plan default
    expect(result.limit).toBe(3);
    expect(result.currentPlan).toBe("free");
  });

  it("should decrease remaining after increment", async () => {
    const companyId = uuidv4();
    await seedSubscription(dataSource, {
      companyId,
      planType: "free",
    });

    // Check before any usage
    const before = await queryBus.execute(
      new CheckQuotaQuery(companyId, "interviews"),
    );
    expect(before.allowed).toBe(true);
    expect(before.remaining).toBe(3);

    // Increment usage
    await commandBus.execute(
      new IncrementUsageCommand(companyId, "interviews", 2),
    );

    // Check after usage
    const after = await queryBus.execute(
      new CheckQuotaQuery(companyId, "interviews"),
    );
    expect(after.allowed).toBe(true);
    expect(after.remaining).toBe(1); // 3 - 2 = 1
  });
});
