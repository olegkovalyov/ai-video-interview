import { Module, NestModule, MiddlewareConsumer, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { HttpModule } from '@nestjs/axios';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './core/auth/auth.module';
import { AuthErrorInterceptor } from './core/auth/interceptors/auth-error.interceptor';
import { ServiceProxyExceptionFilter } from './core/filters/service-proxy-exception.filter';
import { MetricsModule } from './core/metrics/metrics.module';
import { MetricsController } from './core/metrics/metrics.controller';
import { MetricsInterceptor } from './core/metrics/metrics.interceptor';
import { KafkaModule } from './kafka/kafka.module';
import { HealthModule } from './core/health/health.module';
import { LoggingModule } from './core/logging/logging.module';
import { TracingModule } from './core/tracing/tracing.module';
import { CircuitBreakerModule } from './core/circuit-breaker/circuit-breaker.module';
import { CorrelationIdMiddleware } from './core/middleware/correlation-id.middleware';
import { UserServiceModule } from './modules/user-service/user-service.module';
import { InterviewServiceModule } from './modules/interview-service/interview-service.module';
import { AnalysisServiceModule } from './modules/analysis-service/analysis-service.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ThrottlerModule.forRoot([
      { name: 'short', ttl: 60000, limit: 20 },
      { name: 'long', ttl: 3600000, limit: 200 },
    ]),

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
    AnalysisServiceModule,
  ],
  controllers: [
    AppController,
    MetricsController,
  ],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    },
    {
      provide: APP_FILTER,
      useClass: ServiceProxyExceptionFilter,
    },
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
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
