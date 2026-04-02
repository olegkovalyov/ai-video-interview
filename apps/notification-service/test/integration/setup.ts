import { DataSource } from "typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { NotificationEntity } from "../../src/infrastructure/persistence/entities/notification.entity";
import { WebhookEndpointEntity } from "../../src/infrastructure/persistence/entities/webhook-endpoint.entity";
import { NotificationPreferenceEntity } from "../../src/infrastructure/persistence/entities/notification-preference.entity";
import { OutboxEntity } from "../../src/infrastructure/persistence/entities/outbox.entity";
import {
  TestApplicationModule,
  TestLoggerModule,
} from "./test-application.module";
import { DatabaseModule } from "../../src/infrastructure/persistence/database.module";

/**
 * Create PostgreSQL test database connection
 * Uses REAL MIGRATIONS for production-like testing
 */
export async function createTestDataSource(): Promise<DataSource> {
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DATABASE_HOST || "localhost",
    port: parseInt(process.env.DATABASE_PORT || "5432", 10),
    username: process.env.DATABASE_USER || "postgres",
    password: process.env.DATABASE_PASSWORD || "postgres",
    database: "ai_video_interview_notification_test",
    entities: [
      NotificationEntity,
      WebhookEndpointEntity,
      NotificationPreferenceEntity,
      OutboxEntity,
    ],
    migrations: ["src/infrastructure/persistence/migrations/*.ts"],
    synchronize: false,
    logging: false,
  });

  await dataSource.initialize();

  // DROP all tables + Create extensions + Run migrations
  await dropAllTables(dataSource);
  await createExtensions(dataSource);
  await dataSource.runMigrations();

  console.log("Test database initialized with migrations");

  return dataSource;
}

/**
 * Drop all tables in test database
 */
async function dropAllTables(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);
}

/**
 * Create required PostgreSQL extensions
 */
async function createExtensions(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    CREATE EXTENSION IF NOT EXISTS "pgcrypto";
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  `);
}

/**
 * Setup test NestJS application with test database
 */
export async function setupTestApp(
  dataSource: DataSource,
): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.forRoot({
        isGlobal: true,
        ignoreEnvFile: true,
      }),
      TestLoggerModule,
      DatabaseModule,
      TestApplicationModule,
    ],
  })
    .overrideProvider(DataSource)
    .useValue(dataSource)
    .compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
}

/**
 * Clean all data from test database using DELETE
 * Order matters for FK constraints
 */
export async function cleanDatabase(dataSource: DataSource): Promise<void> {
  await dataSource.query(`DELETE FROM outbox`);
  await dataSource.query(`DELETE FROM notifications`);
  await dataSource.query(`DELETE FROM webhook_endpoints`);
  await dataSource.query(`DELETE FROM notification_preferences`);
}

/**
 * Seed a notification directly via SQL for test setup
 */
export async function seedNotification(
  dataSource: DataSource,
  data: {
    id?: string;
    recipientId: string;
    recipientEmail?: string;
    channel?: string;
    template?: string;
    status?: string;
    data?: Record<string, unknown>;
    sentAt?: Date | null;
    error?: string | null;
    retryCount?: number;
  },
): Promise<string> {
  const repo = dataSource.getRepository(NotificationEntity);
  const id = data.id || uuidv4();

  const notification = repo.create({
    id,
    recipientId: data.recipientId,
    recipientEmail: data.recipientEmail || "test@example.com",
    channel: data.channel || "email",
    template: data.template || "welcome",
    status: data.status || "sent",
    data: data.data || {},
    sentAt: data.sentAt ?? new Date(),
    error: data.error ?? null,
    retryCount: data.retryCount ?? 0,
  });

  await repo.save(notification);
  return id;
}

/**
 * Seed a notification preference directly for test setup
 */
export async function seedPreference(
  dataSource: DataSource,
  data: {
    userId: string;
    emailEnabled?: boolean;
    inAppEnabled?: boolean;
    subscriptions?: Record<string, boolean>;
  },
): Promise<void> {
  const repo = dataSource.getRepository(NotificationPreferenceEntity);
  const pref = repo.create({
    userId: data.userId,
    emailEnabled: data.emailEnabled ?? true,
    inAppEnabled: data.inAppEnabled ?? true,
    subscriptions: data.subscriptions ?? {},
  });
  await repo.save(pref);
}

/**
 * Seed a webhook endpoint directly for test setup
 */
export async function seedWebhookEndpoint(
  dataSource: DataSource,
  data: {
    id?: string;
    companyId: string;
    url?: string;
    secret?: string;
    events?: string[];
    status?: string;
    failureCount?: number;
  },
): Promise<string> {
  const repo = dataSource.getRepository(WebhookEndpointEntity);
  const id = data.id || uuidv4();

  const endpoint = repo.create({
    id,
    companyId: data.companyId,
    url: data.url || "https://example.com/webhook",
    secret: data.secret || "test-secret",
    events: data.events || ["notification.sent"],
    status: data.status || "active",
    failureCount: data.failureCount ?? 0,
  });

  await repo.save(endpoint);
  return id;
}
