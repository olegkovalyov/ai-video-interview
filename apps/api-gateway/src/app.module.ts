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
import { MetricsService } from './metrics/metrics.service';
import { MetricsController } from './metrics/metrics.controller';
import { MetricsInterceptor } from './metrics/metrics.interceptor';
import { KafkaModule } from './kafka/kafka.module';
import { HealthController } from './health/health.controller';
import { LoggerService } from './logger/logger.service';
import { TraceService } from './tracing/trace.service';
import {
  AuthOrchestrator,
  SessionManager,
  AuthEventPublisher,
  RedirectUriHelper,
} from './auth/services';
import { UserServiceProxy, InterviewServiceProxy } from './proxies';
import { CircuitBreakerRegistry } from './circuit-breaker';

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
    KafkaModule,
  ],
  controllers: [AppController, AuthController, MetricsController, HealthController],
  providers: [
    AppService, 
    AuthService, // Deprecated - for backward compatibility
    TokenService,
    CookieService,
 
    OidcService,
    KeycloakService,
    JwtAuthGuard,
    JwtRefreshGuard,
    MetricsService,
    LoggerService,
    TraceService,
    
    // New auth services (refactored)
    AuthOrchestrator,
    SessionManager,
    AuthEventPublisher,
    RedirectUriHelper,
    
    // Circuit Breaker
    CircuitBreakerRegistry,
    
    // Service Proxies
    UserServiceProxy,
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
