import { INestApplication } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import {
  setupTestApp,
  createTestDataSource,
  cleanDatabase,
  seedSubscription,
} from "../setup";
import { CancelSubscriptionCommand } from "../../../src/application/commands/cancel-subscription/cancel-subscription.command";
import { ResumeSubscriptionCommand } from "../../../src/application/commands/resume-subscription/resume-subscription.command";
import { SubscriptionEntity } from "../../../src/infrastructure/persistence/entities/subscription.entity";
import { SubscriptionNotFoundException } from "../../../src/domain/exceptions/billing.exceptions";

describe("Cancel/Resume Subscription Integration", () => {
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

  describe("CancelSubscription", () => {
    it("should set cancelAtPeriodEnd=true for active subscription", async () => {
      const companyId = uuidv4();
      const subId = await seedSubscription(dataSource, {
        companyId,
        planType: "plus",
        stripeCustomerId: "cus_test123",
        stripeSubscriptionId: "sub_test123",
      });

      await commandBus.execute(new CancelSubscriptionCommand(companyId));

      const entity = await dataSource
        .getRepository(SubscriptionEntity)
        .findOne({ where: { id: subId } });

      expect(entity).not.toBeNull();
      expect(entity!.cancelAtPeriodEnd).toBe(true);
      expect(entity!.canceledAt).not.toBeNull();
      expect(entity!.status).toBe("active"); // Status stays active until period ends
    });

    it("should throw when subscription not found", async () => {
      const companyId = uuidv4();

      await expect(
        commandBus.execute(new CancelSubscriptionCommand(companyId)),
      ).rejects.toThrow(SubscriptionNotFoundException);
    });

    it("should throw when subscription is already in canceled status", async () => {
      const companyId = uuidv4();
      await seedSubscription(dataSource, {
        companyId,
        planType: "plus",
        status: "canceled",
      });

      await expect(
        commandBus.execute(new CancelSubscriptionCommand(companyId)),
      ).rejects.toThrow(/Cannot cancel subscription/);
    });

    it("should handle optimistic locking on concurrent cancel", async () => {
      const companyId = uuidv4();
      await seedSubscription(dataSource, {
        companyId,
        planType: "plus",
        stripeCustomerId: "cus_test123",
        stripeSubscriptionId: "sub_test123",
      });

      // Execute two cancel commands concurrently
      const results = await Promise.allSettled([
        commandBus.execute(new CancelSubscriptionCommand(companyId)),
        commandBus.execute(new CancelSubscriptionCommand(companyId)),
      ]);

      // At least one should succeed
      const successes = results.filter((r) => r.status === "fulfilled");
      expect(successes.length).toBeGreaterThanOrEqual(1);

      // Verify final DB state is consistent
      const entity = await dataSource
        .getRepository(SubscriptionEntity)
        .findOne({ where: { companyId } });

      expect(entity).not.toBeNull();
      expect(entity!.cancelAtPeriodEnd).toBe(true);
    });
  });

  describe("ResumeSubscription", () => {
    it("should set cancelAtPeriodEnd=false when resuming", async () => {
      const companyId = uuidv4();
      const subId = await seedSubscription(dataSource, {
        companyId,
        planType: "plus",
        stripeCustomerId: "cus_test123",
        stripeSubscriptionId: "sub_test123",
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      });

      await commandBus.execute(new ResumeSubscriptionCommand(companyId));

      const entity = await dataSource
        .getRepository(SubscriptionEntity)
        .findOne({ where: { id: subId } });

      expect(entity).not.toBeNull();
      expect(entity!.cancelAtPeriodEnd).toBe(false);
      expect(entity!.canceledAt).toBeNull();
      expect(entity!.status).toBe("active");
    });

    it("should throw when trying to resume a non-canceled subscription", async () => {
      const companyId = uuidv4();
      await seedSubscription(dataSource, {
        companyId,
        planType: "plus",
        cancelAtPeriodEnd: false, // Not scheduled for cancellation
      });

      await expect(
        commandBus.execute(new ResumeSubscriptionCommand(companyId)),
      ).rejects.toThrow(/not scheduled for cancellation/);
    });
  });
});
