import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminController } from './admin.controller';
import { KeycloakAdminService } from './keycloak-admin.service';
import { UserCommandPublisher } from './user-command-publisher.service';
import { UserOrchestrationSaga } from './user-orchestration.saga';
import { UserServiceHttpClient } from './user-service-http.client';
import { OrphanedUsersService } from './orphaned-users.service';
import { LoggerService } from '../logger/logger.service';
import { KafkaModule } from '../kafka/kafka.module';
import { AuthModule } from '../auth/auth.module';

/**
 * Admin Module
 * Управление пользователями через Saga Orchestration Pattern
 * 
 * Architecture:
 * - UserOrchestrationSaga coordinates Keycloak + User Service
 * - UserServiceHttpClient handles HTTP communication
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
    UserServiceHttpClient,
    OrphanedUsersService,
    LoggerService,
  ],
  exports: [
    KeycloakAdminService,
    UserOrchestrationSaga,
    UserServiceHttpClient, // Export for RegistrationSaga
  ],
})
export class AdminModule {}
