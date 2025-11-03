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
import { HealthModule } from './core/health/health.module';
import { LoggingModule } from './core/logging/logging.module';
import { TracingModule } from './core/tracing/tracing.module';
import {
  AuthOrchestrator,
  SessionManager,
  AuthEventPublisher,
  RedirectUriHelper,
} from './auth/services';
import { RegistrationSaga } from './auth/registration.saga';
import { InterviewServiceProxy } from './proxies';
import { CircuitBreakerModule } from './core/circuit-breaker/circuit-breaker.module';
import { UserServiceModule } from './modules/user-service/user-service.module';

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
    MetricsModule,
    TracingModule,
    CircuitBreakerModule,
    HealthModule,
    
    KafkaModule,
    
    // Microservice modules
    UserServiceModule,
  ],
  controllers: [
    AppController,
    AuthController,
    MetricsController,
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
    
    // New auth services (refactored)
    AuthOrchestrator,
    SessionManager,
    AuthEventPublisher,
    RedirectUriHelper,
    RegistrationSaga, // Saga for ensuring user exists on login
    
    // Service Clients
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
