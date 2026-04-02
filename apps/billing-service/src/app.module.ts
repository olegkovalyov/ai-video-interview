import { Module, OnModuleDestroy } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { DatabaseModule } from "./infrastructure/persistence/database.module";
import { KafkaModule } from "./infrastructure/kafka/kafka.module";
import { HttpModule } from "./infrastructure/http/http.module";
import { LoggerModule } from "./infrastructure/logger/logger.module";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { MetricsModule } from "./infrastructure/metrics/metrics.module";
import { MetricsInterceptor } from "./infrastructure/metrics/metrics.interceptor";
import { CorrelationIdInterceptor } from "./infrastructure/http/interceptors/correlation-id.interceptor";
import { ApplicationModule } from "./application/application.module";
import { CacheModule } from "./infrastructure/cache/cache.module";
import { StripeModule } from "./infrastructure/stripe/stripe.module";
import { EventHandlers } from "./application/event-handlers";
import { DomainExceptionFilter } from "./infrastructure/http/filters/domain-exception.filter";
import { sdk } from "./infrastructure/tracing/tracing";
import { LoggerService } from "./infrastructure/logger/logger.service";

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),

    // Logging (Global)
    LoggerModule,

    // Infrastructure
    DatabaseModule,
    KafkaModule,
    MessagingModule,
    CqrsModule,
    CacheModule,
    StripeModule,

    // Application Layer (CQRS)
    ApplicationModule,

    // HTTP (Controllers)
    HttpModule,

    // Metrics (Prometheus)
    MetricsModule,
  ],
  providers: [
    // Event handlers registered here (requires MessagingModule for OutboxService)
    ...EventHandlers,
    // Global filters resolved from DI (for LoggerService injection)
    DomainExceptionFilter,
    // CorrelationId propagation (must be before MetricsInterceptor)
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    // Global HTTP metrics interceptor
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule implements OnModuleDestroy {
  constructor(private readonly logger: LoggerService) {}

  async onModuleDestroy() {
    this.logger.info("Shutting down OpenTelemetry SDK", {
      service: "billing-service",
      action: "shutdown",
    });
    await sdk.shutdown().catch((error) => {
      this.logger.error("Error shutting down OpenTelemetry", {
        service: "billing-service",
        error: error.message,
      });
    });
  }
}
