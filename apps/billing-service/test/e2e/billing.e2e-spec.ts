import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { InternalServiceGuard } from "../../src/infrastructure/http/guards/internal-service.guard";
import { DomainExceptionFilter } from "../../src/infrastructure/http/filters/domain-exception.filter";
import { BillingController } from "../../src/infrastructure/http/controllers/billing.controller";
import { DatabaseModule } from "../../src/infrastructure/persistence/database.module";
import { CommandHandlers } from "../../src/application/commands";
import { QueryHandlers } from "../../src/application/queries";
import { QuotaCacheService } from "../../src/infrastructure/cache/quota-cache.service";
import {
  createTestDataSource,
  cleanDatabase,
  seedSubscription,
  seedUsageRecord,
  getCurrentPeriod,
} from "../integration/setup";
import {
  TestLoggerModule,
  mockLoggerService,
  mockStripeService,
  mockOutboxService,
  mockQuotaCacheService,
} from "../integration/test-application.module";
import { TestInternalServiceGuard } from "./test-internal-service.guard";

describe("Billing API (E2E)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let companyId: string;

  beforeAll(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TestLoggerModule,
        CqrsModule,
        DatabaseModule,
      ],
      controllers: [BillingController],
      providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        { provide: "IOutboxService", useValue: mockOutboxService },
        { provide: "IStripeService", useValue: mockStripeService },
        { provide: QuotaCacheService, useValue: mockQuotaCacheService },
        DomainExceptionFilter,
        InternalServiceGuard,
      ],
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .overrideGuard(InternalServiceGuard)
      .useClass(TestInternalServiceGuard)
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(app.get(DomainExceptionFilter));

    await app.init();
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    companyId = uuidv4();

    // Reset mocks
    jest.clearAllMocks();
    mockQuotaCacheService.getQuotaCheck.mockResolvedValue(null);
    mockQuotaCacheService.getSubscription.mockResolvedValue(null);
    mockQuotaCacheService.getInvoices.mockResolvedValue(null);
    mockStripeService.createCheckoutSession.mockResolvedValue({
      sessionId: "mock-session-id",
      checkoutUrl: "https://checkout.stripe.com/mock",
    });
    mockStripeService.listInvoices.mockResolvedValue([]);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  // ---- GET /plans ----

  describe("GET /plans", () => {
    it("should return 3 plans (public, no auth required)", async () => {
      const res = await request(app.getHttpServer()).get("/plans").expect(200);

      expect(res.body).toHaveLength(3);
      const types = res.body.map((p: any) => p.type);
      expect(types).toEqual(expect.arrayContaining(["free", "plus", "pro"]));

      const freePlan = res.body.find((p: any) => p.type === "free");
      expect(freePlan.priceMonthly).toBe(0);
      expect(freePlan.limits.interviewsPerMonth).toBe(3);

      const proPlan = res.body.find((p: any) => p.type === "pro");
      expect(proPlan.priceMonthly).toBe(9900);
      expect(proPlan.limits.interviewsPerMonth).toBe(-1); // unlimited
    });
  });

  // ---- GET /subscription ----

  describe("GET /subscription", () => {
    it("should return free plan for seeded subscription", async () => {
      await seedSubscription(dataSource, { companyId });

      const res = await request(app.getHttpServer())
        .get("/subscription")
        .set("x-company-id", companyId)
        .expect(200);

      expect(res.body.companyId).toBe(companyId);
      expect(res.body.planType).toBe("free");
      expect(res.body.planName).toBe("Free");
      expect(res.body.status).toBe("active");
      expect(res.body.cancelAtPeriodEnd).toBe(false);
      expect(res.body.limits).toBeDefined();
      expect(res.body.limits.interviewsPerMonth).toBe(3);
    });

    it("should return 404 when no subscription exists", async () => {
      const unknownCompanyId = uuidv4();

      const res = await request(app.getHttpServer())
        .get("/subscription")
        .set("x-company-id", unknownCompanyId)
        .expect(404);

      expect(res.body.statusCode).toBe(404);
      expect(res.body.error).toBe("Not Found");
    });
  });

  // ---- GET /usage ----

  describe("GET /usage", () => {
    it("should return zero usage for new subscription", async () => {
      await seedSubscription(dataSource, { companyId });

      const res = await request(app.getHttpServer())
        .get("/usage")
        .set("x-company-id", companyId)
        .expect(200);

      expect(res.body.planType).toBe("free");
      expect(res.body.usage.interviewsUsed).toBe(0);
      expect(res.body.usage.interviewsLimit).toBe(3);
      expect(res.body.period).toBe(getCurrentPeriod());
    });
  });

  // ---- POST /cancel ----

  describe("POST /cancel", () => {
    it("should set cancelAtPeriodEnd for active subscription", async () => {
      await seedSubscription(dataSource, { companyId });

      const res = await request(app.getHttpServer())
        .post("/cancel")
        .set("x-company-id", companyId)
        .expect(201);

      expect(res.body.message).toContain("canceled");

      // Verify via GET /subscription
      const sub = await request(app.getHttpServer())
        .get("/subscription")
        .set("x-company-id", companyId)
        .expect(200);

      expect(sub.body.cancelAtPeriodEnd).toBe(true);
      expect(sub.body.canceledAt).toBeTruthy();
    });

    it("should return 404 for unknown company", async () => {
      const unknownCompanyId = uuidv4();

      await request(app.getHttpServer())
        .post("/cancel")
        .set("x-company-id", unknownCompanyId)
        .expect(404);
    });
  });

  // ---- POST /resume ----

  describe("POST /resume", () => {
    it("should resume a canceled subscription", async () => {
      await seedSubscription(dataSource, {
        companyId,
        cancelAtPeriodEnd: true,
        canceledAt: new Date(),
      });

      const res = await request(app.getHttpServer())
        .post("/resume")
        .set("x-company-id", companyId)
        .expect(201);

      expect(res.body.message).toContain("resumed");

      // Verify via GET /subscription
      const sub = await request(app.getHttpServer())
        .get("/subscription")
        .set("x-company-id", companyId)
        .expect(200);

      expect(sub.body.cancelAtPeriodEnd).toBe(false);
      expect(sub.body.canceledAt).toBeNull();
    });

    it("should return 422 when subscription is not canceling", async () => {
      await seedSubscription(dataSource, {
        companyId,
        cancelAtPeriodEnd: false,
      });

      await request(app.getHttpServer())
        .post("/resume")
        .set("x-company-id", companyId)
        .expect(422);
    });
  });

  // ---- GET /invoices ----

  describe("GET /invoices", () => {
    it("should return empty array for free plan (no Stripe customer)", async () => {
      await seedSubscription(dataSource, {
        companyId,
        stripeCustomerId: null,
      });

      const res = await request(app.getHttpServer())
        .get("/invoices")
        .set("x-company-id", companyId)
        .expect(200);

      expect(res.body).toEqual([]);
    });
  });

  // ---- POST /checkout ----

  describe("POST /checkout", () => {
    it("should call stripe and return checkout URL", async () => {
      await seedSubscription(dataSource, { companyId, planType: "free" });

      const res = await request(app.getHttpServer())
        .post("/checkout")
        .set("x-company-id", companyId)
        .send({ planType: "plus" })
        .expect(201);

      expect(res.body.sessionId).toBe("mock-session-id");
      expect(res.body.checkoutUrl).toBe("https://checkout.stripe.com/mock");
      expect(mockStripeService.createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId,
          planType: "plus",
        }),
      );
    });

    it("should return 422 for invalid plan transition (pro -> plus)", async () => {
      await seedSubscription(dataSource, { companyId, planType: "pro" });

      await request(app.getHttpServer())
        .post("/checkout")
        .set("x-company-id", companyId)
        .send({ planType: "plus" })
        .expect(422);
    });

    it("should return 400 for missing planType", async () => {
      await seedSubscription(dataSource, { companyId });

      await request(app.getHttpServer())
        .post("/checkout")
        .set("x-company-id", companyId)
        .send({})
        .expect(400);
    });
  });

  // ---- Full lifecycle ----

  describe("Full lifecycle", () => {
    it("should support: seed free -> checkout -> verify -> cancel -> verify cancelAtPeriodEnd", async () => {
      // 1. Seed free subscription
      await seedSubscription(dataSource, { companyId, planType: "free" });

      // 2. Verify free plan
      let sub = await request(app.getHttpServer())
        .get("/subscription")
        .set("x-company-id", companyId)
        .expect(200);
      expect(sub.body.planType).toBe("free");
      expect(sub.body.cancelAtPeriodEnd).toBe(false);

      // 3. Create checkout for plus
      const checkout = await request(app.getHttpServer())
        .post("/checkout")
        .set("x-company-id", companyId)
        .send({ planType: "plus" })
        .expect(201);
      expect(checkout.body.checkoutUrl).toBeTruthy();

      // 4. Simulate upgrade by directly updating DB (webhook would do this)
      await dataSource.query(
        `UPDATE subscriptions SET plan_type = 'plus', stripe_customer_id = 'cus_test123', stripe_subscription_id = 'sub_test123' WHERE company_id = $1`,
        [companyId],
      );

      // 5. Verify plus plan
      sub = await request(app.getHttpServer())
        .get("/subscription")
        .set("x-company-id", companyId)
        .expect(200);
      expect(sub.body.planType).toBe("plus");
      expect(sub.body.limits.interviewsPerMonth).toBe(100);

      // 6. Cancel
      await request(app.getHttpServer())
        .post("/cancel")
        .set("x-company-id", companyId)
        .expect(201);

      // 7. Verify cancelAtPeriodEnd
      sub = await request(app.getHttpServer())
        .get("/subscription")
        .set("x-company-id", companyId)
        .expect(200);
      expect(sub.body.cancelAtPeriodEnd).toBe(true);
      expect(sub.body.canceledAt).toBeTruthy();
      expect(sub.body.planType).toBe("plus"); // Still plus until period ends
    });
  });
});
