import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../src/infrastructure/persistence/database.module';

// Controllers (direct import to avoid module dependencies)
import { UsersController } from '../../src/infrastructure/http/controllers/users.controller';
import { UserAdminController } from '../../src/infrastructure/http/controllers/user-admin.controller';
import { UserProfilesController } from '../../src/infrastructure/http/controllers/user-profiles.controller';
import { HealthController } from '../../src/infrastructure/http/controllers/health.controller';

// Command Handlers
import { CreateUserHandler } from '../../src/application/commands/create-user/create-user.handler';
import { UpdateUserHandler } from '../../src/application/commands/update-user/update-user.handler';
import { DeleteUserHandler } from '../../src/application/commands/delete-user/delete-user.handler';
import { SuspendUserHandler } from '../../src/application/commands/suspend-user/suspend-user.handler';
import { ActivateUserHandler } from '../../src/application/commands/activate-user/activate-user.handler';
import { SelectRoleHandler } from '../../src/application/commands/select-role/select-role.handler';
import { UploadAvatarHandler } from '../../src/application/commands/upload-avatar/upload-avatar.handler';
import { UpdateCandidateProfileHandler } from '../../src/application/commands/update-candidate-profile/update-candidate-profile.handler';
import { UpdateHRProfileHandler } from '../../src/application/commands/update-hr-profile/update-hr-profile.handler';

// Query Handlers
import { GetUserHandler } from '../../src/application/queries/get-user/get-user.handler';
import { GetUserByExternalAuthIdHandler } from '../../src/application/queries/get-user-by-external-auth-id/get-user-by-external-auth-id.handler';
import { ListUsersHandler } from '../../src/application/queries/list-users/list-users.handler';
import { GetUserStatsHandler } from '../../src/application/queries/get-user-stats/get-user-stats.handler';
import { GetUserPermissionsHandler } from '../../src/application/queries/get-user-permissions/get-user-permissions.handler';

// Services
import { OutboxService } from '../../src/infrastructure/messaging/outbox/outbox.service';
import { LoggerService } from '../../src/infrastructure/logger/logger.service';

// Mock services for testing
export const mockKafkaService = {
  connect: jest.fn().mockResolvedValue(undefined),
  disconnect: jest.fn().mockResolvedValue(undefined),
  send: jest.fn().mockResolvedValue(undefined),
  publishEvent: jest.fn().mockResolvedValue(undefined),
};

export const mockOutboxService = {
  save: jest.fn().mockResolvedValue(undefined),
  saveEvent: jest.fn().mockResolvedValue(undefined),
  publishPendingEvents: jest.fn().mockResolvedValue(undefined),
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
    UserProfilesController,
    HealthController,
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
    UpdateCandidateProfileHandler,
    UpdateHRProfileHandler,

    // Query Handlers
    GetUserHandler,
    GetUserByExternalAuthIdHandler,
    ListUsersHandler,
    GetUserStatsHandler,
    GetUserPermissionsHandler,

    // Mock services
    {
      provide: 'KAFKA_SERVICE',
      useValue: mockKafkaService,
    },
    {
      provide: OutboxService,
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
