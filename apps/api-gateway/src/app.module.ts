import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthentikService } from './auth/authentik.service';
import { OidcService } from './auth/oidc.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Support running from apps/api-gateway while reading root .env
      envFilePath: ['.env', '../../.env'],
    }),
    KafkaModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService, AuthentikService, OidcService, JwtAuthGuard],
})
export class AppModule {}
