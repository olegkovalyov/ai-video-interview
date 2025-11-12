import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from '../infrastructure/persistence/database.module';
import { KafkaModule } from '../infrastructure/kafka/kafka.module';
import { StorageModule } from '../infrastructure/storage/storage.module';
import { MessagingModule } from '../infrastructure/messaging/messaging.module';

// User Command Handlers
import { CreateUserHandler } from './commands/create-user/create-user.handler';
import { UpdateUserHandler } from './commands/update-user/update-user.handler';
import { SuspendUserHandler } from './commands/suspend-user/suspend-user.handler';
import { ActivateUserHandler } from './commands/activate-user/activate-user.handler';
import { DeleteUserHandler } from './commands/delete-user/delete-user.handler';
import { UploadAvatarHandler } from './commands/upload-avatar/upload-avatar.handler';
import { SelectRoleHandler } from './commands/select-role';

// Admin Skills Command Handlers
import { CreateSkillHandler } from './commands/admin/create-skill';
import { UpdateSkillHandler } from './commands/admin/update-skill';
import { DeleteSkillHandler } from './commands/admin/delete-skill';
import { ActivateSkillHandler } from './commands/admin/activate-skill';
import { DeactivateSkillHandler } from './commands/admin/deactivate-skill';

// HR Companies Command Handlers
import { CreateCompanyHandler } from './commands/hr/create-company';
import { UpdateCompanyHandler } from './commands/hr/update-company';
import { DeleteCompanyHandler } from './commands/hr/delete-company';

// Candidate Skills Command Handlers
import { AddCandidateSkillHandler } from './commands/candidate/add-candidate-skill';
import { UpdateCandidateSkillHandler } from './commands/candidate/update-candidate-skill';
import { RemoveCandidateSkillHandler } from './commands/candidate/remove-candidate-skill';

// Candidate Profile Command Handlers
import { UpdateCandidateExperienceLevelHandler } from './commands/candidate/update-experience-level';

// User Query Handlers
import { GetUserHandler } from './queries/get-user/get-user.handler';
import { GetUserByExternalAuthIdHandler } from './queries/get-user-by-external-auth-id/get-user-by-external-auth-id.handler';
import { ListUsersHandler } from './queries/list-users/list-users.handler';
import { GetUserPermissionsHandler } from './queries/get-user-permissions/get-user-permissions.handler';
import { GetUserStatsHandler } from './queries/get-user-stats/get-user-stats.handler';

// Skills Query Handlers
import { ListSkillsHandler } from './queries/skills/list-skills';
import { GetSkillHandler } from './queries/skills/get-skill';
import { ListSkillCategoriesHandler } from './queries/skills/list-categories';

// Companies Query Handlers
import { ListCompaniesHandler } from './queries/companies';
import { GetCompanyHandler } from './queries/companies';
import { ListUserCompaniesHandler } from './queries/companies';

// Candidate Query Handlers
import { GetCandidateSkillsHandler } from './queries/candidate';
import { SearchCandidatesBySkillsHandler } from './queries/candidate';
import { GetCandidateProfileHandler } from './queries/candidate';

const CommandHandlers = [
  // User Commands
  CreateUserHandler,
  UpdateUserHandler,
  SuspendUserHandler,
  ActivateUserHandler,
  DeleteUserHandler,
  UploadAvatarHandler,
  SelectRoleHandler,
  
  // Admin Skills Commands
  CreateSkillHandler,
  UpdateSkillHandler,
  DeleteSkillHandler,
  ActivateSkillHandler,
  DeactivateSkillHandler,
  
  // HR Companies Commands
  CreateCompanyHandler,
  UpdateCompanyHandler,
  DeleteCompanyHandler,
  
  // Candidate Skills Commands
  AddCandidateSkillHandler,
  UpdateCandidateSkillHandler,
  RemoveCandidateSkillHandler,
  
  // Candidate Profile Commands
  UpdateCandidateExperienceLevelHandler,
];

const QueryHandlers = [
  // User Queries
  GetUserHandler,
  GetUserByExternalAuthIdHandler,
  ListUsersHandler,
  GetUserPermissionsHandler,
  GetUserStatsHandler,
  
  // Skills Queries
  ListSkillsHandler,
  GetSkillHandler,
  ListSkillCategoriesHandler,
  
  // Companies Queries
  ListCompaniesHandler,
  GetCompanyHandler,
  ListUserCompaniesHandler,
  
  // Candidate Queries
  GetCandidateSkillsHandler,
  SearchCandidatesBySkillsHandler,
  GetCandidateProfileHandler,
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
