import { Module, Global } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { DatabaseModule } from "../../src/infrastructure/persistence/database.module";
import { LoggerService } from "../../src/infrastructure/logger/logger.service";
import { CommandHandlers } from "../../src/application/commands";
import { QueryHandlers } from "../../src/application/queries";

// Mock services for testing (no Redis/Kafka/Bull/SMTP dependencies)

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

export const mockEmailService = {
  send: jest.fn().mockResolvedValue(undefined),
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
 * - IOutboxService (mock -- no Redis/BullMQ)
 * - IEmailService (mock -- no SMTP)
 * - LoggerService (mock -- no Winston/Loki)
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
      provide: "IEmailService",
      useValue: mockEmailService,
    },
  ],
  exports: [CqrsModule],
})
export class TestApplicationModule {}
