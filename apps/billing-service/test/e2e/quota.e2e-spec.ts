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

describe("Quota API (E2E)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

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
    jest.clearAllMocks();
    mockQuotaCacheService.getQuotaCheck.mockResolvedValue(null);
    mockQuotaCacheService.getSubscription.mockResolvedValue(null);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  describe("GET /api/billing/internal/quota/:companyId/interviews", () => {
    it("should return allowed=true when under limit", async () => {
      const companyId = uuidv4();
      const subId = await seedSubscription(dataSource, {
        companyId,
        planType: "free",
      });

      // Seed 1 interview used (limit is 3 for free)
      await seedUsageRecord(dataSource, {
        subscriptionId: subId,
        period: getCurrentPeriod(),
        interviewsUsed: 1,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/billing/internal/quota/${companyId}/interviews`)
        .expect(200);

      expect(res.body.allowed).toBe(true);
      expect(res.body.remaining).toBe(2);
      expect(res.body.limit).toBe(3);
      expect(res.body.currentPlan).toBe("free");
    });

    it("should return allowed=false when at limit", async () => {
      const companyId = uuidv4();
      const subId = await seedSubscription(dataSource, {
        companyId,
        planType: "free",
      });

      // Seed 3 interviews used (limit is 3 for free)
      await seedUsageRecord(dataSource, {
        subscriptionId: subId,
        period: getCurrentPeriod(),
        interviewsUsed: 3,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/billing/internal/quota/${companyId}/interviews`)
        .expect(200);

      expect(res.body.allowed).toBe(false);
      expect(res.body.remaining).toBe(0);
      expect(res.body.limit).toBe(3);
      expect(res.body.currentPlan).toBe("free");
    });

    it("should return allowed=true for pro plan (unlimited)", async () => {
      const companyId = uuidv4();
      const subId = await seedSubscription(dataSource, {
        companyId,
        planType: "pro",
      });

      // Seed heavy usage
      await seedUsageRecord(dataSource, {
        subscriptionId: subId,
        period: getCurrentPeriod(),
        interviewsUsed: 9999,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/billing/internal/quota/${companyId}/interviews`)
        .expect(200);

      expect(res.body.allowed).toBe(true);
      expect(res.body.remaining).toBe(-1); // unlimited
      expect(res.body.limit).toBe(-1);
      expect(res.body.currentPlan).toBe("pro");
    });

    it("should return free plan defaults when no subscription exists", async () => {
      const companyId = uuidv4();

      const res = await request(app.getHttpServer())
        .get(`/api/billing/internal/quota/${companyId}/interviews`)
        .expect(200);

      expect(res.body.allowed).toBe(true);
      expect(res.body.remaining).toBe(3);
      expect(res.body.limit).toBe(3);
      expect(res.body.currentPlan).toBe("free");
    });

    it("should check templates quota for plus plan", async () => {
      const companyId = uuidv4();
      await seedSubscription(dataSource, {
        companyId,
        planType: "plus",
      });

      const res = await request(app.getHttpServer())
        .get(`/api/billing/internal/quota/${companyId}/templates`)
        .expect(200);

      expect(res.body.allowed).toBe(true);
      expect(res.body.limit).toBe(50);
      expect(res.body.currentPlan).toBe("plus");
    });

    it("should cache quota check results", async () => {
      const companyId = uuidv4();
      await seedSubscription(dataSource, {
        companyId,
        planType: "free",
      });

      await request(app.getHttpServer())
        .get(`/api/billing/internal/quota/${companyId}/interviews`)
        .expect(200);

      expect(mockQuotaCacheService.setQuotaCheck).toHaveBeenCalledWith(
        companyId,
        "interviews",
        expect.objectContaining({
          allowed: true,
          limit: 3,
          currentPlan: "free",
        }),
      );
    });
  });
});
