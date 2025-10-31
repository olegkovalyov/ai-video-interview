import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { KeycloakAdminService } from './keycloak-admin.service';
import { UserCommandPublisher } from './user-command-publisher.service';
import { LoggerService } from '../logger/logger.service';
import { KafkaModule } from '../kafka/kafka.module';

/**
 * Admin Module
 * Управление пользователями через Keycloak Admin API + Kafka commands
 */
@Module({
  imports: [KafkaModule],
  controllers: [AdminController],
  providers: [
    KeycloakAdminService,
    UserCommandPublisher,
    LoggerService,
  ],
  exports: [KeycloakAdminService],
})
export class AdminModule {}
