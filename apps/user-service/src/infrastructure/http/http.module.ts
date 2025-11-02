import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersController } from './controllers/users.controller';
import { InternalController } from './controllers/internal.controller';
import { HealthController } from './controllers/health.controller';
import { RolesGuard } from './guards/roles.guard';
import { InternalServiceGuard } from './guards/internal-service.guard';
import { ApplicationModule } from '../../application/application.module';
import { StorageModule } from '../storage/storage.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [ConfigModule, ApplicationModule, StorageModule, KafkaModule],
  controllers: [UsersController, InternalController, HealthController],
  providers: [RolesGuard, InternalServiceGuard],
})
export class HttpModule {}
