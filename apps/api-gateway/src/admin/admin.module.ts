import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminUsersController } from './controllers/admin-users.controller';
import { AdminRolesController } from './controllers/admin-roles.controller';
import { AdminActionsController } from './controllers/admin-actions.controller';
import { KeycloakTokenService, KeycloakUserService, KeycloakRoleService, KeycloakEmailService } from './keycloak';
import { UserCommandPublisher } from './user-command-publisher.service';
import { UserOrchestrationSaga } from './user-orchestration.saga';
import { OrphanedUsersService } from './orphaned-users.service';
import { LoggerService } from '../core/logging/logger.service';
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
  controllers: [
    AdminUsersController,
    AdminRolesController,
    AdminActionsController,
  ],
  providers: [
    // Keycloak modular services
    KeycloakTokenService,
    KeycloakUserService,
    KeycloakRoleService,
    KeycloakEmailService,
    
    // Saga orchestration
    UserOrchestrationSaga,
    UserCommandPublisher, // Keep for suspend/activate (async operations)
    OrphanedUsersService,
    
    // Shared services
    UserServiceClient,
    LoggerService,
    CircuitBreakerRegistry,
  ],
  exports: [
    KeycloakUserService, // Export for RegistrationSaga
    UserOrchestrationSaga,
    UserServiceClient,
  ],
})
export class AdminModule {}
