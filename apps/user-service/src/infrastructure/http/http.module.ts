import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { UsersController } from './controllers/users.controller';
import { InternalController } from './controllers/internal.controller';
import { HealthController } from './controllers/health.controller';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { InternalServiceGuard } from './guards/internal-service.guard';
import { ApplicationModule } from '../../application/application.module';
import { StorageModule } from '../storage/storage.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports: [ConfigModule, ApplicationModule, StorageModule, KafkaModule],
  controllers: [UsersController, InternalController, HealthController],
  providers: [
    // Global JWT Guard
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    RolesGuard,
    InternalServiceGuard,
  ],
})
export class HttpModule {}
