import { Logger, Module, OnModuleDestroy } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { ApplicationModule } from "./application/application.module";
import { HttpModule } from "./infrastructure/http/http.module";
import { KafkaModule } from "./infrastructure/kafka/kafka.module";
import { MessagingModule } from "./infrastructure/messaging/messaging.module";
import { DatabaseModule } from "./infrastructure/persistence/database.module";
import { LlmModule } from "./infrastructure/llm/llm.module";
import { MetricsModule } from "./infrastructure/metrics/metrics.module";
import { MetricsInterceptor } from "./infrastructure/metrics/metrics.interceptor";
import { CorrelationIdInterceptor } from "./infrastructure/http/interceptors/correlation-id.interceptor";
import { CleanupService } from "./infrastructure/scheduling/cleanup.service";
import { sdk } from "./infrastructure/tracing/tracing";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    LlmModule,
    KafkaModule,
    MessagingModule,
    ApplicationModule,
    MetricsModule,
    HttpModule,
  ],
  providers: [
    CleanupService,
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: MetricsInterceptor },
  ],
})
export class AppModule implements OnModuleDestroy {
  private readonly logger = new Logger(AppModule.name);

  async onModuleDestroy() {
    this.logger.log("Shutting down OpenTelemetry SDK");
    await sdk.shutdown().catch((error) => {
      this.logger.error("Error shutting down OpenTelemetry", error);
    });
  }
}
