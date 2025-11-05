import { Module } from '@nestjs/common';
import { HealthController } from './controllers/health.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { InternalServiceGuard } from './guards/internal-service.guard';
import { KafkaModule } from '../kafka/kafka.module';

/**
 * HTTP Module
 * Controllers, Guards, and HTTP-related infrastructure
 */
@Module({
  imports: [
    ConfigModule,
    KafkaModule, // For KAFKA_SERVICE dependency in HealthController
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'change-me-in-production'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '15m'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [HealthController],
  providers: [JwtAuthGuard, RolesGuard, InternalServiceGuard],
  exports: [JwtAuthGuard, RolesGuard, InternalServiceGuard],
})
export class HttpModule {}
