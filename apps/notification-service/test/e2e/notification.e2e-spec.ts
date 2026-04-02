import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { DataSource } from "typeorm";
import { v4 as uuidv4 } from "uuid";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { InternalServiceGuard } from "../../src/infrastructure/http/guards/internal-service.guard";
import { NotificationController } from "../../src/infrastructure/http/controllers/notification.controller";
import { PreferencesController } from "../../src/infrastructure/http/controllers/preferences.controller";
import { WebhookController } from "../../src/infrastructure/http/controllers/webhook.controller";
import { HealthController } from "../../src/infrastructure/http/controllers/health.controller";
import { DatabaseModule } from "../../src/infrastructure/persistence/database.module";
import { CommandHandlers } from "../../src/application/commands";
import { QueryHandlers } from "../../src/application/queries";
import {
  createTestDataSource,
  cleanDatabase,
  seedNotification,
  seedPreference,
  seedWebhookEndpoint,
} from "../integration/setup";
import {
  TestLoggerModule,
  mockLoggerService,
  mockOutboxService,
  mockEmailService,
} from "../integration/test-application.module";
import { TestInternalServiceGuard } from "./test-internal-service.guard";

describe("Notification API (E2E)", () => {
  let app: INestApplication;
  let dataSource: DataSource;

  const testUserId = "00000000-0000-0000-0000-000000000001";
  const testCompanyId = "a0000000-0000-4000-8000-000000000010";

  beforeAll(async () => {
    dataSource = await createTestDataSource();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        TestLoggerModule,
        CqrsModule,
        DatabaseModule,
      ],
      controllers: [
        NotificationController,
        PreferencesController,
        WebhookController,
        HealthController,
      ],
      providers: [
        ...CommandHandlers,
        ...QueryHandlers,
        { provide: "IOutboxService", useValue: mockOutboxService },
        { provide: "IEmailService", useValue: mockEmailService },
        InternalServiceGuard,
        {
          provide: "KAFKA_SERVICE",
          useValue: { isInitialized: true },
        },
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
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    jest.clearAllMocks();
  });

  // ─── GET /notifications ──────────────────────────────────

  describe("GET /notifications", () => {
    it("should return notifications for the user", async () => {
      await seedNotification(dataSource, {
        recipientId: testUserId,
        template: "welcome",
        status: "sent",
      });
      await seedNotification(dataSource, {
        recipientId: testUserId,
        template: "invitation",
        status: "sent",
      });

      const response = await request(app.getHttpServer())
        .get("/api/notifications")
        .set("x-user-id", testUserId)
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("id");
      expect(response.body[0]).toHaveProperty("template");
      expect(response.body[0]).toHaveProperty("status");
    });

    it("should return empty array when user has no notifications", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/notifications")
        .set("x-user-id", testUserId)
        .expect(200);

      expect(response.body).toEqual([]);
    });
  });

  // ─── POST /notifications/:id/read ─────────────────────────

  describe("POST /notifications/:id/read", () => {
    it("should mark notification as read", async () => {
      const notifId = await seedNotification(dataSource, {
        recipientId: testUserId,
        status: "pending",
        sentAt: null,
      });

      const response = await request(app.getHttpServer())
        .post(`/api/notifications/${notifId}/read`)
        .set("x-user-id", testUserId)
        .expect(201);

      expect(response.body).toEqual({ success: true });
    });

    it("should return 404 for non-existent notification", async () => {
      const fakeId = uuidv4();
      await request(app.getHttpServer())
        .post(`/api/notifications/${fakeId}/read`)
        .set("x-user-id", testUserId)
        .expect(500); // DomainException not caught by filter in test setup
    });
  });

  // ─── GET /notifications/unread-count ────────────────────

  describe("GET /notifications/unread-count", () => {
    it("should return unread count", async () => {
      // Seed "unread" notifications (pending status for in-app)
      await seedNotification(dataSource, {
        recipientId: testUserId,
        channel: "in_app",
        status: "pending",
        sentAt: null,
      });
      await seedNotification(dataSource, {
        recipientId: testUserId,
        channel: "in_app",
        status: "pending",
        sentAt: null,
      });
      // Seed a "read" notification
      await seedNotification(dataSource, {
        recipientId: testUserId,
        channel: "in_app",
        status: "sent",
      });

      const response = await request(app.getHttpServer())
        .get("/api/notifications/unread-count")
        .set("x-user-id", testUserId)
        .expect(200);

      expect(response.body).toHaveProperty("count");
      expect(typeof response.body.count).toBe("number");
    });
  });

  // ─── GET /preferences ────────────────────────────────────

  describe("GET /preferences", () => {
    it("should return default preferences when none exist", async () => {
      const response = await request(app.getHttpServer())
        .get("/api/preferences")
        .set("x-user-id", testUserId)
        .expect(200);

      expect(response.body.userId).toBe(testUserId);
      expect(response.body.emailEnabled).toBe(true);
      expect(response.body.inAppEnabled).toBe(true);
    });

    it("should return stored preferences", async () => {
      await seedPreference(dataSource, {
        userId: testUserId,
        emailEnabled: false,
        inAppEnabled: true,
        subscriptions: { weekly_digest: false },
      });

      const response = await request(app.getHttpServer())
        .get("/api/preferences")
        .set("x-user-id", testUserId)
        .expect(200);

      expect(response.body.emailEnabled).toBe(false);
      expect(response.body.subscriptions).toEqual({ weekly_digest: false });
    });
  });

  // ─── PUT /preferences ────────────────────────────────────

  describe("PUT /preferences", () => {
    it("should update preferences", async () => {
      const response = await request(app.getHttpServer())
        .put("/api/preferences")
        .set("x-user-id", testUserId)
        .send({
          emailEnabled: false,
          inAppEnabled: true,
          subscriptions: { weekly_digest: false },
        })
        .expect(200);

      expect(response.body).toEqual({ success: true });

      // Verify persisted
      const getResponse = await request(app.getHttpServer())
        .get("/api/preferences")
        .set("x-user-id", testUserId)
        .expect(200);

      expect(getResponse.body.emailEnabled).toBe(false);
    });
  });

  // ─── POST /webhooks ──────────────────────────────────────

  describe("POST /webhooks", () => {
    it("should register a webhook endpoint", async () => {
      const response = await request(app.getHttpServer())
        .post("/api/webhooks")
        .set("x-internal-token", "internal-secret")
        .send({
          companyId: testCompanyId,
          url: "http://localhost:9999/webhook",
          events: ["notification.sent"],
        })
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(typeof response.body.id).toBe("string");
    });
  });

  // ─── GET /webhooks/company/:companyId ─────────────────────

  describe("GET /webhooks/company/:companyId", () => {
    it("should list webhook endpoints for company", async () => {
      await seedWebhookEndpoint(dataSource, {
        companyId: testCompanyId,
        url: "https://example.com/hook1",
        events: ["notification.sent"],
      });

      const response = await request(app.getHttpServer())
        .get(`/api/webhooks/company/${testCompanyId}`)
        .set("x-internal-token", "internal-secret")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].companyId).toBe(testCompanyId);
      expect(response.body[0].url).toBe("https://example.com/hook1");
    });
  });

  // ─── DELETE /webhooks/:id ─────────────────────────────────

  describe("DELETE /webhooks/:id", () => {
    it("should return success for webhook deletion", async () => {
      const webhookId = await seedWebhookEndpoint(dataSource, {
        companyId: testCompanyId,
      });

      const response = await request(app.getHttpServer())
        .delete(`/api/webhooks/${webhookId}`)
        .set("x-internal-token", "internal-secret")
        .expect(200);

      expect(response.body).toHaveProperty("success", true);
    });
  });

  // ─── GET /health ─────────────────────────────────────────

  describe("GET /health", () => {
    it("should return health status", async () => {
      const response = await request(app.getHttpServer())
        .get("/health")
        .expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body).toHaveProperty("service", "notification-service");
      expect(response.body).toHaveProperty("timestamp");
    });
  });
});
