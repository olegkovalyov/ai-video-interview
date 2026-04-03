import { DataSource } from "typeorm";
import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { v4 as uuidv4 } from "uuid";
import { SubscriptionEntity } from "../../src/infrastructure/persistence/entities/subscription.entity";
import { UsageRecordEntity } from "../../src/infrastructure/persistence/entities/usage-record.entity";
import { PaymentEventEntity } from "../../src/infrastructure/persistence/entities/payment-event.entity";
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
    database: "ai_video_interview_billing_test",
    entities: [
      SubscriptionEntity,
      UsageRecordEntity,
      PaymentEventEntity,
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
  await dataSource.query(`DELETE FROM payment_events`);
  await dataSource.query(`DELETE FROM usage_records`);
  await dataSource.query(`DELETE FROM outbox`);
  await dataSource.query(`DELETE FROM subscriptions`);
}

/**
 * Seed a subscription directly via SQL for test setup
 */
export async function seedSubscription(
  dataSource: DataSource,
  data: {
    id?: string;
    companyId: string;
    planType?: string;
    status?: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    cancelAtPeriodEnd?: boolean;
    canceledAt?: Date | null;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  },
): Promise<string> {
  const repo = dataSource.getRepository(SubscriptionEntity);
  const id = data.id || uuidv4();
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const subscription = repo.create({
    id,
    companyId: data.companyId,
    planType: data.planType || "free",
    status: data.status || "active",
    stripeCustomerId: data.stripeCustomerId ?? null,
    stripeSubscriptionId: data.stripeSubscriptionId ?? null,
    currentPeriodStart: data.currentPeriodStart || now,
    currentPeriodEnd: data.currentPeriodEnd || periodEnd,
    cancelAtPeriodEnd: data.cancelAtPeriodEnd ?? false,
    canceledAt: data.canceledAt ?? null,
    trialEnd: null,
    createdAt: now,
    updatedAt: now,
  });

  await repo.save(subscription);
  return id;
}

/**
 * Seed a usage record directly for test setup
 */
export async function seedUsageRecord(
  dataSource: DataSource,
  data: {
    subscriptionId: string;
    period: string;
    interviewsUsed?: number;
    analysisTokensUsed?: number;
    storageUsedMb?: number;
  },
): Promise<void> {
  const repo = dataSource.getRepository(UsageRecordEntity);
  const record = repo.create({
    subscriptionId: data.subscriptionId,
    period: data.period,
    interviewsUsed: data.interviewsUsed ?? 0,
    analysisTokensUsed: data.analysisTokensUsed ?? 0,
    storageUsedMb: data.storageUsedMb ?? 0,
  });
  await repo.save(record);
}

/**
 * Get the current period string (YYYY-MM)
 */
export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}
