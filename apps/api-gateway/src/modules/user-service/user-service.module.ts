import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AdminModule } from './admin/admin.module';
import { UsersController } from './controllers/users.controller';
import { UserSkillsController } from './controllers/user-skills.controller';
import { SkillsController } from './controllers/skills.controller';
import { HRController } from './controllers/hr.controller';
import { HRCompaniesController } from './controllers/hr-companies.controller';
import { UserServiceClient } from './clients/user-service.client';
import { AuthModule } from '../../core/auth/auth.module';

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
    forwardRef(() => AuthModule),
    AdminModule,
  ],
  controllers: [
    UsersController,
    UserSkillsController,
    SkillsController,
    HRController,
    HRCompaniesController,
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
