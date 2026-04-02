import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { KafkaService } from "@repo/shared";
import { LoggerModule } from "../logger/logger.module";
import { UserEventsConsumer } from "./consumers/user-events.consumer";
import { InterviewEventsConsumer } from "./consumers/interview-events.consumer";
import { AnalysisEventsConsumer } from "./consumers/analysis-events.consumer";
import { BillingEventsConsumer } from "./consumers/billing-events.consumer";

/**
 * Kafka Module
 * Handles Kafka integration for Notification Service
 *
 * Producers: Notification events via OutboxService
 * Consumers: user-events, interview-events, analysis-events, billing-events
 */
@Module({
  imports: [ConfigModule, LoggerModule],
  providers: [
    {
      provide: "KAFKA_CONFIG",
      useFactory: (configService: ConfigService) => ({
        clientId: configService.get("KAFKA_CLIENT_ID", "notification-service"),
        brokers: configService
          .get("KAFKA_BROKERS", "localhost:9092")
          .split(","),
        ssl: configService.get("KAFKA_SSL", "false") === "true",
        sasl:
          configService.get("KAFKA_SASL_ENABLED", "false") === "true"
            ? {
                mechanism: "plain",
                username: configService.get("KAFKA_SASL_USERNAME"),
                password: configService.get("KAFKA_SASL_PASSWORD"),
              }
            : undefined,
      }),
      inject: [ConfigService],
    },
    {
      provide: "KAFKA_SERVICE",
      useFactory: () => {
        return new KafkaService("notification-service");
      },
    },
    UserEventsConsumer,
    InterviewEventsConsumer,
    AnalysisEventsConsumer,
    BillingEventsConsumer,
  ],
  exports: ["KAFKA_SERVICE"],
})
export class KafkaModule {}
