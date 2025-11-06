import {Module} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {HealthController} from './controllers/health.controller';
import {RolesGuard} from './guards/roles.guard';
import {InternalServiceGuard} from './guards/internal-service.guard';
import {ApplicationModule} from '../../application/application.module';
import {StorageModule} from '../storage/storage.module';
import {KafkaModule} from '../kafka/kafka.module';
import {UserAdminController} from './controllers/user-admin.controller';
import {UsersController} from './controllers/users.controller';
import {UserProfilesController} from './controllers/user-profiles.controller';

@Module({
  imports: [
    ConfigModule,
    ApplicationModule,
    StorageModule,
    KafkaModule,
  ],
  controllers: [
    HealthController,
    UserAdminController,
    UsersController,
    UserProfilesController,
  ],
  providers: [
    RolesGuard,
    InternalServiceGuard,
  ],
})
export class HttpModule {
}
