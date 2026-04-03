import { INestApplication } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedSubscription,
} from "../setup";
import { GetSubscriptionQuery } from "../../../src/application/queries/get-subscription/get-subscription.query";
import { SubscriptionNotFoundException } from "../../../src/domain/exceptions/billing.exceptions";
import { PLANS } from "../../../src/config/plans.config";

describe("GetSubscriptionQuery Integration", () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    queryBus = app.get(QueryBus);
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    jest.clearAllMocks();
  });

  afterAll(async () => {
    if (app) await app.close();
    if (dataSource?.isInitialized) await dataSource.destroy();
  });

  it("should return subscription with plan details", async () => {
    const companyId = uuidv4();
    const subId = await seedSubscription(dataSource, {
      companyId,
      planType: "plus",
      stripeCustomerId: "cus_test123",
      stripeSubscriptionId: "sub_test123",
    });

    const result = await queryBus.execute(new GetSubscriptionQuery(companyId));

    expect(result.id).toBe(subId);
    expect(result.companyId).toBe(companyId);
    expect(result.planType).toBe("plus");
    expect(result.planName).toBe("Plus");
    expect(result.status).toBe("active");
    expect(result.stripeCustomerId).toBe("cus_test123");
    expect(result.cancelAtPeriodEnd).toBe(false);
    expect(result.canceledAt).toBeNull();
    expect(result.currentPeriodStart).toBeDefined();
    expect(result.currentPeriodEnd).toBeDefined();
    expect(result.createdAt).toBeDefined();
  });

  it("should return correct limits from plan config", async () => {
    const companyId = uuidv4();
    await seedSubscription(dataSource, {
      companyId,
      planType: "pro",
      stripeCustomerId: "cus_pro123",
      stripeSubscriptionId: "sub_pro123",
    });

    const result = await queryBus.execute(new GetSubscriptionQuery(companyId));

    expect(result.limits).toEqual(PLANS.pro.limits);
    expect(result.limits.interviewsPerMonth).toBe(-1); // Unlimited
    expect(result.limits.maxTemplates).toBe(-1);
    expect(result.limits.maxTeamMembers).toBe(-1);
    expect(result.features).toEqual(PLANS.pro.features);
  });

  it("should throw SubscriptionNotFoundException for non-existent company", async () => {
    const companyId = uuidv4();

    await expect(
      queryBus.execute(new GetSubscriptionQuery(companyId)),
    ).rejects.toThrow(SubscriptionNotFoundException);
  });
});
