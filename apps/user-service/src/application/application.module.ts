import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../infrastructure/persistence/database.module';
import { KafkaModule } from '../infrastructure/kafka/kafka.module';
import { StorageModule } from '../infrastructure/storage/storage.module';
import { MessagingModule } from '../infrastructure/messaging/messaging.module';

// Command Handlers
import { CreateUserHandler } from './commands/create-user/create-user.handler';
import { UpdateUserHandler } from './commands/update-user/update-user.handler';
import { SuspendUserHandler } from './commands/suspend-user/suspend-user.handler';
import { ActivateUserHandler } from './commands/activate-user/activate-user.handler';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler';
import { UploadAvatarHandler } from './commands/upload-avatar/upload-avatar.handler';
import { SelectRoleHandler } from './commands/select-role';
import { UpdateCandidateProfileHandler } from './commands/update-candidate-profile';
import { UpdateHRProfileHandler } from './commands/update-hr-profile';

// Query Handlers
import { GetUserHandler } from './queries/get-user/get-user.handler';
import { GetUserByExternalAuthIdHandler } from './queries/get-user-by-external-auth-id/get-user-by-external-auth-id.handler';
import { ListUsersHandler } from './queries/list-users/list-users.handler';
import { GetUserPermissionsHandler } from './queries/get-user-permissions/get-user-permissions.handler';
import { GetUserStatsHandler } from './queries/get-user-stats/get-user-stats.handler';

const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  SuspendUserHandler,
  ActivateUserHandler,
  DeleteUserHandler,
  UploadAvatarHandler,
  SelectRoleHandler,
  UpdateCandidateProfileHandler,
  UpdateHRProfileHandler,
];

const QueryHandlers = [
  GetUserHandler,
  GetUserByExternalAuthIdHandler,
  ListUsersHandler,
  GetUserPermissionsHandler,
  GetUserStatsHandler,
];

@Module({
  imports: [
    CqrsModule,
    DatabaseModule, // Provides repositories
    KafkaModule, // Provides Kafka producer (for consumers)
    StorageModule, // Provides storage service
    MessagingModule, // Provides OutboxService for Command Handlers
  ],
  providers: [
    ...CommandHandlers, 
    ...QueryHandlers,
    // Domain Events use internal EventBus (NestJS)
    // Integration Events published directly from Command Handlers via OutboxService
  ],
  exports: [CqrsModule],
})
export class ApplicationModule {}
