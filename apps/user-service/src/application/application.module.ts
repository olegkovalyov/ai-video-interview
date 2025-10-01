import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../infrastructure/persistence/database.module';
import { KafkaModule } from '../infrastructure/kafka/kafka.module';
import { StorageModule } from '../infrastructure/storage/storage.module';

// Command Handlers
import { CreateUserHandler } from './commands/create-user/create-user.handler';
import { UpdateUserHandler } from './commands/update-user/update-user.handler';
import { SuspendUserHandler } from './commands/suspend-user/suspend-user.handler';
import { ActivateUserHandler } from './commands/activate-user/activate-user.handler';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler';
import { UploadAvatarHandler } from './commands/upload-avatar/upload-avatar.handler';

// Query Handlers
import { GetUserHandler } from './queries/get-user/get-user.handler';
import { GetUserByKeycloakIdHandler } from './queries/get-user-by-keycloak-id/get-user-by-keycloak-id.handler';
import { ListUsersHandler } from './queries/list-users/list-users.handler';
import { GetUserPermissionsHandler } from './queries/get-user-permissions/get-user-permissions.handler';
import { GetUserStatsHandler } from './queries/get-user-stats/get-user-stats.handler';

// Event Handlers (Domain Events → Kafka)
// import { UserCreatedEventHandler } from './event-handlers/user-created.handler';
// import { UserUpdatedEventHandler } from './event-handlers/user-updated.handler';

const CommandHandlers = [
  CreateUserHandler,
  UpdateUserHandler,
  SuspendUserHandler,
  ActivateUserHandler,
  DeleteUserHandler,
  UploadAvatarHandler,
];

const QueryHandlers = [
  GetUserHandler,
  GetUserByKeycloakIdHandler,
  ListUsersHandler,
  GetUserPermissionsHandler,
  GetUserStatsHandler,
];

const EventHandlers = [
  // UserCreatedEventHandler,
  // UserUpdatedEventHandler,
];

@Module({
  imports: [
    CqrsModule,
    DatabaseModule, // Provides repositories
    KafkaModule, // Provides Kafka producer
    StorageModule, // Provides storage service
  ],
  providers: [...CommandHandlers, ...QueryHandlers, ...EventHandlers],
  exports: [CqrsModule],
})
export class ApplicationModule {}
