import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../src/infrastructure/persistence/database.module';
import { LoggerModule } from '../../src/infrastructure/logger/logger.module';
import { TemplatesController } from '../../src/infrastructure/http/controllers/templates.controller';
import { InvitationsController } from '../../src/infrastructure/http/controllers/invitations.controller';
import { JwtAuthGuard } from '../../src/infrastructure/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/infrastructure/http/guards/roles.guard';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';
import { DomainExceptionFilter } from '../../src/infrastructure/http/filters/domain-exception.filter';
import { CommandHandlers } from '../../src/application/commands';
import { QueryHandlers } from '../../src/application/queries';

/**
 * Test App Module for E2E tests
 *
 * Same as AppModule but WITHOUT:
 * - MessagingModule (Redis/BullMQ)
 * - KafkaModule (Kafka consumers)
 * - MetricsModule (Prometheus)
 * - EventHandlers (require OutboxService from MessagingModule)
 * - HealthController (requires KAFKA_SERVICE)
 *
 * Handlers are registered directly with mock IOutboxService/LoggerService
 * (same pattern as user-service TestApplicationModule).
 */
@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
    }),

    // Logging
    LoggerModule,

    // Database (includes IUnitOfWork + repositories)
    DatabaseModule,

    // CQRS
    CqrsModule,

    // JWT (inline, without KafkaModule dependency)
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'test-secret'),
        signOptions: { expiresIn: '15m' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [
    // Note: HealthController excluded (requires KAFKA_SERVICE)
    TemplatesController,
    InvitationsController,
  ],
  providers: [
    // All command + query handlers (registered directly, not via ApplicationModule)
    ...CommandHandlers,
    ...QueryHandlers,

    // Guards
    JwtAuthGuard,
    RolesGuard,
    InternalServiceGuard,

    // Mock infrastructure (replaces MessagingModule)
    {
      provide: 'IOutboxService',
      useValue: {
        saveEvent: jest.fn().mockResolvedValue('mock-event-id'),
        saveEvents: jest.fn().mockResolvedValue(['mock-event-id']),
        schedulePublishing: jest.fn().mockResolvedValue(undefined),
      },
    },

    // Global filters (resolved from DI for LoggerService injection)
    DomainExceptionFilter,
  ],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, InternalServiceGuard],
})
export class TestAppModule {}
