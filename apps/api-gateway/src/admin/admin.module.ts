import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminController } from './admin.controller';
import { KeycloakAdminService } from './keycloak-admin.service';
import { UserCommandPublisher } from './user-command-publisher.service';
import { UserOrchestrationSaga } from './user-orchestration.saga';
import { OrphanedUsersService } from './orphaned-users.service';
import { LoggerService } from '../logger/logger.service';
import { KafkaModule } from '../kafka/kafka.module';
import { AuthModule } from '../auth/auth.module';
import { UserServiceClient } from '../clients';
import { CircuitBreakerRegistry } from '../circuit-breaker';

/**
 * Admin Module
 * Управление пользователями через Saga Orchestration Pattern
 * 
 * Architecture:
 * - UserOrchestrationSaga coordinates Keycloak + User Service
 * - UserServiceClient handles HTTP communication (unified proxy + internal)
 * - OrphanedUsersService tracks rollback failures
 * - Synchronous operations with compensation logic
 */
@Module({
  imports: [
    HttpModule,
    KafkaModule,
    AuthModule,
  ],
  controllers: [AdminController],
  providers: [
    KeycloakAdminService,
    UserCommandPublisher, // Keep for suspend/activate (async operations)
    UserOrchestrationSaga,
    UserServiceClient,
    OrphanedUsersService,
    LoggerService,
    CircuitBreakerRegistry,
  ],
  exports: [
    KeycloakAdminService,
    UserOrchestrationSaga,
    UserServiceClient, // Export for RegistrationSaga
  ],
})
export class AdminModule {}
