import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../src/infrastructure/persistence/database.module';

// Controllers (direct import to avoid module dependencies)
import { UsersController } from '../../src/infrastructure/http/controllers/users.controller';
import { UserAdminController } from '../../src/infrastructure/http/controllers/user-admin.controller';
import { HealthController } from '../../src/infrastructure/http/controllers/health.controller';
import { SkillsController } from '../../src/infrastructure/http/controllers/skills.controller';
import { CompaniesController } from '../../src/infrastructure/http/controllers/companies.controller';
import { CandidatesController } from '../../src/infrastructure/http/controllers/candidates.controller';

// Command Handlers
import { CreateUserHandler } from '../../src/application/commands/create-user/create-user.handler';
import { UpdateUserHandler } from '../../src/application/commands/update-user/update-user.handler';
import { DeleteUserHandler } from '../../src/application/commands/delete-user/delete-user.handler';
import { SuspendUserHandler } from '../../src/application/commands/suspend-user/suspend-user.handler';
import { ActivateUserHandler } from '../../src/application/commands/activate-user/activate-user.handler';
import { SelectRoleHandler } from '../../src/application/commands/select-role/select-role.handler';
import { UploadAvatarHandler } from '../../src/application/commands/upload-avatar/upload-avatar.handler';

// Query Handlers
import { GetUserHandler } from '../../src/application/queries/get-user/get-user.handler';
import { GetUserByExternalAuthIdHandler } from '../../src/application/queries/get-user-by-external-auth-id/get-user-by-external-auth-id.handler';
import { ListUsersHandler } from '../../src/application/queries/list-users/list-users.handler';
import { GetUserStatsHandler } from '../../src/application/queries/get-user-stats/get-user-stats.handler';
import { GetUserPermissionsHandler } from '../../src/application/queries/get-user-permissions/get-user-permissions.handler';

// Skills handlers
import { CreateSkillHandler } from '../../src/application/commands/admin/create-skill/create-skill.handler';
import { UpdateSkillHandler } from '../../src/application/commands/admin/update-skill/update-skill.handler';
import { DeleteSkillHandler } from '../../src/application/commands/admin/delete-skill/delete-skill.handler';
import { ActivateSkillHandler } from '../../src/application/commands/admin/activate-skill/activate-skill.handler';
import { DeactivateSkillHandler } from '../../src/application/commands/admin/deactivate-skill/deactivate-skill.handler';
import { ListSkillsHandler } from '../../src/application/queries/skills/list-skills/list-skills.handler';
import { GetSkillHandler } from '../../src/application/queries/skills/get-skill/get-skill.handler';
import { ListSkillCategoriesHandler } from '../../src/application/queries/skills/list-categories/list-categories.handler';

// Companies handlers
import { CreateCompanyHandler } from '../../src/application/commands/hr/create-company/create-company.handler';
import { UpdateCompanyHandler } from '../../src/application/commands/hr/update-company/update-company.handler';
import { DeleteCompanyHandler } from '../../src/application/commands/hr/delete-company/delete-company.handler';
import { ListCompaniesHandler } from '../../src/application/queries/companies/list-companies.handler';
import { GetCompanyHandler } from '../../src/application/queries/companies/get-company.handler';
import { ListUserCompaniesHandler } from '../../src/application/queries/companies/list-user-companies.handler';

// Candidates handlers
import { AddCandidateSkillHandler } from '../../src/application/commands/candidate/add-candidate-skill/add-candidate-skill.handler';
import { UpdateCandidateSkillHandler } from '../../src/application/commands/candidate/update-candidate-skill/update-candidate-skill.handler';
import { RemoveCandidateSkillHandler } from '../../src/application/commands/candidate/remove-candidate-skill/remove-candidate-skill.handler';
import { UpdateCandidateExperienceLevelHandler } from '../../src/application/commands/candidate/update-experience-level/update-experience-level.handler';
import { GetCandidateProfileHandler } from '../../src/application/queries/candidate/get-candidate-profile.handler';
import { GetCandidateSkillsHandler } from '../../src/application/queries/candidate/get-candidate-skills.handler';
import { SearchCandidatesBySkillsHandler } from '../../src/application/queries/candidate/search-candidates-by-skills.handler';

// Services
import { LoggerService } from '../../src/infrastructure/logger/logger.service';
import { InternalServiceGuard } from '../../src/infrastructure/http/guards/internal-service.guard';

// Mock services for testing
export const mockKafkaService = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue(undefined),
  publishEvent: jest.fn().mockResolvedValue(undefined),
};

export const mockOutboxService = {
  save: jest.fn().mockResolvedValue(undefined),
  saveEvent: jest.fn().mockResolvedValue('mock-event-id'),
  saveEvents: jest.fn().mockResolvedValue(['mock-event-id']),
  publishPendingEvents: jest.fn().mockResolvedValue(undefined),
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
};

export const mockStorageService = {
  uploadFile: jest
    .fn()
    .mockResolvedValue('https://storage.example.com/avatars/test-avatar.jpg'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

/**
 * Test Application Module
 * Minimal module for E2E tests with mocked dependencies
 * - NO KafkaModule (no Kafka connections)
 * - NO MessagingModule (no BullMQ)
 * - NO LoggerModule (no real logger)
 * - NO StorageModule (mocked)
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    CqrsModule,
    DatabaseModule, // Provides repositories ONLY
  ],
  controllers: [
    UsersController,
    UserAdminController,
    HealthController,
    SkillsController,
    CompaniesController,
    CandidatesController,
  ],
  providers: [
    // Command Handlers
    CreateUserHandler,
    UpdateUserHandler,
    DeleteUserHandler,
    SuspendUserHandler,
    ActivateUserHandler,
    SelectRoleHandler,
    UploadAvatarHandler,

    // Query Handlers
    GetUserHandler,
    GetUserByExternalAuthIdHandler,
    ListUsersHandler,
    GetUserStatsHandler,
    GetUserPermissionsHandler,

    // Skills handlers
    CreateSkillHandler,
    UpdateSkillHandler,
    DeleteSkillHandler,
    ActivateSkillHandler,
    DeactivateSkillHandler,
    ListSkillsHandler,
    GetSkillHandler,
    ListSkillCategoriesHandler,

    // Companies handlers
    CreateCompanyHandler,
    UpdateCompanyHandler,
    DeleteCompanyHandler,
    ListCompaniesHandler,
    GetCompanyHandler,
    ListUserCompaniesHandler,

    // Candidates handlers
    AddCandidateSkillHandler,
    UpdateCandidateSkillHandler,
    RemoveCandidateSkillHandler,
    UpdateCandidateExperienceLevelHandler,
    GetCandidateProfileHandler,
    GetCandidateSkillsHandler,
    SearchCandidatesBySkillsHandler,

    // Mock services
    {
      provide: 'KAFKA_SERVICE',
      useValue: mockKafkaService,
    },
    {
      provide: 'IOutboxService',
      useValue: mockOutboxService,
    },
    {
      provide: LoggerService,
      useValue: mockLoggerService,
    },
    {
      provide: 'IStorageService',
      useValue: mockStorageService,
    },
  ],
  exports: [],
})
export class TestApplicationModule {}
