import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminModule } from './admin/admin.module';
import { UsersController } from './controllers/users.controller';
import { UserServiceClient } from './clients/user-service.client';
import { AuthModule } from '../../auth/auth.module';

/**
 * User Service Module
 * Aggregates all user-service related functionality
 * 
 * Structure:
 * - AdminModule: Admin user management (CRUD, roles, actions)
 * - UsersController: Public user endpoints (/api/users/me)
 * - UserServiceClient: HTTP client for user-service communication
 * 
 * This module encapsulates all API Gateway interactions with User Service.
 */
@Module({
  imports: [
    HttpModule,
    AuthModule,
    AdminModule,
  ],
  controllers: [
    UsersController,
  ],
  providers: [
    UserServiceClient,
  ],
  exports: [
    AdminModule,
    UserServiceClient,
  ],
})
export class UserServiceModule {}
