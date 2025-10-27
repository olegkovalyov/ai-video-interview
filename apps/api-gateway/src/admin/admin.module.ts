import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { KeycloakAdminService } from './keycloak-admin.service';
import { LoggerService } from '../logger/logger.service';

/**
 * Admin Module
 * Управление пользователями через Keycloak Admin API
 */
@Module({
  controllers: [AdminController],
  providers: [KeycloakAdminService, LoggerService],
  exports: [KeycloakAdminService],
})
export class AdminModule {}
