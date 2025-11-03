import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { TokenService } from './auth/token.service';
import { CookieService } from './auth/cookie.service';
import { OidcService } from './auth/oidc.service';
import { KeycloakService } from './auth/keycloak.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { JwtRefreshGuard } from './auth/jwt-refresh.guard';
import { AuthErrorInterceptor } from './auth/auth-error.interceptor';
import { MetricsModule } from './core/metrics/metrics.module';
import { MetricsController } from './core/metrics/metrics.controller';
import { MetricsInterceptor } from './core/metrics/metrics.interceptor';
import { KafkaModule } from './kafka/kafka.module';
import { HealthController } from './health/health.controller';
import { UsersController } from './users/users.controller';
import { LoggingModule } from './core/logging/logging.module';
import { TraceService } from './tracing/trace.service';
import {
  AuthOrchestrator,
  SessionManager,
  AuthEventPublisher,
  RedirectUriHelper,
} from './auth/services';
import { RegistrationSaga } from './auth/registration.saga';
import { UserServiceClient } from './clients';
import { InterviewServiceProxy } from './proxies';
import { CircuitBreakerRegistry } from './circuit-breaker';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Support running from apps/api-gateway while reading root .env
      envFilePath: ['.env', '../../.env'],
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    
    // Core infrastructure
    LoggingModule,
    
    KafkaModule,
    MetricsModule,
    AdminModule,
  ],
  controllers: [
    AppController,
    AuthController,
    MetricsController,
    HealthController,
    UsersController,
  ],
  providers: [
    AppService, 
    AuthService, // Deprecated - for backward compatibility
    TokenService,
    CookieService,
 
    OidcService,
    KeycloakService,
    JwtAuthGuard,
    JwtRefreshGuard,
    TraceService,
    
    // New auth services (refactored)
    AuthOrchestrator,
    SessionManager,
    AuthEventPublisher,
    RedirectUriHelper,
    RegistrationSaga, // Saga for ensuring user exists on login
    
    // Circuit Breaker
    CircuitBreakerRegistry,
    
    // Service Clients
    UserServiceClient,
    InterviewServiceProxy,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuthErrorInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: MetricsInterceptor,
    },
  ],
})
export class AppModule {}
