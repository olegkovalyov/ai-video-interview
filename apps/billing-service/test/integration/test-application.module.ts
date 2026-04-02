import { Module, Global } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { DatabaseModule } from "../../src/infrastructure/persistence/database.module";
import { LoggerService } from "../../src/infrastructure/logger/logger.service";
import { QuotaCacheService } from "../../src/infrastructure/cache/quota-cache.service";
import { CommandHandlers } from "../../src/application/commands";
import { QueryHandlers } from "../../src/application/queries";

// Mock services for testing (no Redis/Kafka/Bull/Stripe dependencies)

export const mockOutboxService = {
  saveEvent: jest.fn().mockResolvedValue("mock-event-id"),
  saveEvents: jest.fn().mockResolvedValue(["mock-event-id"]),
  schedulePublishing: jest.fn().mockResolvedValue(undefined),
};

export const mockLoggerService = {
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  verbose: jest.fn(),
  setContext: jest.fn().mockReturnThis(),
  commandLog: jest.fn(),
  queryLog: jest.fn(),
};

export const mockStripeService = {
  createCheckoutSession: jest.fn().mockResolvedValue({
    sessionId: "mock-session-id",
    checkoutUrl: "https://checkout.stripe.com/mock",
  }),
  createPortalSession: jest.fn().mockResolvedValue({
    portalUrl: "https://billing.stripe.com/mock",
  }),
  constructWebhookEvent: jest.fn(),
  listInvoices: jest.fn().mockResolvedValue([]),
};

export const mockQuotaCacheService = {
  incrementUsage: jest.fn().mockResolvedValue(undefined),
  getQuotaCheck: jest.fn().mockResolvedValue(null), // Always miss cache -> go to DB
  setQuotaCheck: jest.fn().mockResolvedValue(undefined),
  getSubscription: jest.fn().mockResolvedValue(null),
  setSubscription: jest.fn().mockResolvedValue(undefined),
  invalidateSubscription: jest.fn().mockResolvedValue(undefined),
  getInvoices: jest.fn().mockResolvedValue(null),
  setInvoices: jest.fn().mockResolvedValue(undefined),
};

/**
 * Test Logger Module
 * Global mock replacement for LoggerModule.
 */
@Global()
@Module({
  providers: [
    {
      provide: LoggerService,
      useValue: mockLoggerService,
    },
  ],
  exports: [LoggerService],
})
export class TestLoggerModule {}

/**
 * Test Application Module
 * Same handlers as ApplicationModule but with mocked infrastructure:
 * - IOutboxService (mock — no Redis/BullMQ)
 * - IStripeService (mock — no Stripe API)
 * - QuotaCacheService (mock — no Redis)
 * - LoggerService (mock — no Winston/Loki)
 */
@Module({
  imports: [CqrsModule, DatabaseModule],
  providers: [
    // All command + query handlers
    ...CommandHandlers,
    ...QueryHandlers,

    // Mock infrastructure services
    {
      provide: "IOutboxService",
      useValue: mockOutboxService,
    },
    {
      provide: "IStripeService",
      useValue: mockStripeService,
    },
    {
      provide: QuotaCacheService,
      useValue: mockQuotaCacheService,
    },
  ],
  exports: [CqrsModule],
})
export class TestApplicationModule {}
