import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { AuthErrorInterceptor } from './core/auth/interceptors/auth-error.interceptor';
import { MetricsModule } from './core/metrics/metrics.module';
import { MetricsController } from './core/metrics/metrics.controller';
import { MetricsInterceptor } from './core/metrics/metrics.interceptor';
import { KafkaModule } from './kafka/kafka.module';
import { HealthModule } from './core/health/health.module';
import { LoggingModule } from './core/logging/logging.module';
import { TracingModule } from './core/tracing/tracing.module';
import { CircuitBreakerModule } from './core/circuit-breaker/circuit-breaker.module';
import { UserServiceModule } from './modules/user-service/user-service.module';
import { InterviewServiceModule } from './modules/interview-service/interview-service.module';

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
    AuthModule,
    
    KafkaModule,
    
    // Microservice modules
    UserServiceModule,
    InterviewServiceModule,
  ],
  controllers: [
    AppController,
    MetricsController,
  ],
  providers: [
    AppService,
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
