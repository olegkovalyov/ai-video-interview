import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../../src/infrastructure/persistence/database.module';
import { LoggerModule } from '../../src/infrastructure/logger/logger.module';
import { ApplicationModule } from '../../src/application/application.module';
import { TemplatesController } from '../../src/infrastructure/http/controllers/templates.controller';
import { InvitationsController } from '../../src/infrastructure/http/controllers/invitations.controller';
import { JwtAuthGuard } from '../../src/infrastructure/http/guards/jwt-auth.guard';
import { RolesGuard } from '../../src/infrastructure/http/guards/roles.guard';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';

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
 * Controllers are imported directly to avoid HttpModule → KafkaModule dependency chain.
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
    
    // Database
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
    
    // Application Layer
    ApplicationModule,
  ],
  controllers: [
    // Note: HealthController excluded (requires KAFKA_SERVICE)
    TemplatesController,
    InvitationsController,
  ],
  providers: [JwtAuthGuard, RolesGuard, InternalServiceGuard],
  exports: [JwtModule, JwtAuthGuard, RolesGuard, InternalServiceGuard],
})
export class TestAppModule {}
