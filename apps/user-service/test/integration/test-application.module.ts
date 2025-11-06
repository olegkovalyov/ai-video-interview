import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../../src/infrastructure/persistence/database.module';
import { StorageModule } from '../../src/infrastructure/storage/storage.module';
import { OutboxService } from '../../src/infrastructure/messaging/outbox/outbox.service';
import { LoggerService } from '../../src/infrastructure/logger/logger.service';

// Import all command handlers
import { CreateUserHandler } from '../../src/application/commands/create-user/create-user.handler';
import { UpdateUserHandler } from '../../src/application/commands/update-user/update-user.handler';
import { DeleteUserHandler } from '../../src/application/commands/delete-user/delete-user.handler';
import { SuspendUserHandler } from '../../src/application/commands/suspend-user/suspend-user.handler';
import { ActivateUserHandler } from '../../src/application/commands/activate-user/activate-user.handler';
import { SelectRoleHandler } from '../../src/application/commands/select-role/select-role.handler';
import { UploadAvatarHandler } from '../../src/application/commands/upload-avatar/upload-avatar.handler';
import { UpdateCandidateProfileHandler } from '../../src/application/commands/update-candidate-profile/update-candidate-profile.handler';
import { UpdateHRProfileHandler } from '../../src/application/commands/update-hr-profile/update-hr-profile.handler';

// Import all query handlers
import { GetUserHandler } from '../../src/application/queries/get-user/get-user.handler';
import { GetUserByExternalAuthIdHandler } from '../../src/application/queries/get-user-by-external-auth-id/get-user-by-external-auth-id.handler';
import { ListUsersHandler } from '../../src/application/queries/list-users/list-users.handler';
import { GetUserStatsHandler } from '../../src/application/queries/get-user-stats/get-user-stats.handler';

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
  uploadFile: jest.fn().mockResolvedValue('https://storage.example.com/avatars/test-avatar.jpg'),
  deleteFile: jest.fn().mockResolvedValue(undefined),
};

/**
 * Test Application Module
 * Same as ApplicationModule but WITHOUT KafkaModule and MessagingModule
 * to prevent real Kafka connections in integration tests
 */
@Module({
  imports: [
    CqrsModule,
    DatabaseModule, // Provides repositories
    StorageModule, // Provides storage service
    // KafkaModule is EXCLUDED for tests
    // MessagingModule is EXCLUDED for tests
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

    // Mock services - use actual classes as tokens (not strings!)
    {
      provide: 'KafkaService',
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
