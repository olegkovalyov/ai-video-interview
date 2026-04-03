import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { KafkaService } from "@repo/shared";
import { LoggerModule } from "../logger/logger.module";
import { UserCreatedConsumer } from "./consumers/user-created.consumer";
import { UsageTrackingConsumer } from "./consumers/usage-tracking.consumer";

/**
 * Kafka Module
 * Handles Kafka integration for Billing Service
 *
 * Producers: Domain events via OutboxService
 * Consumers: user-events, interview-events, analysis-events
 */
@Module({
  imports: [ConfigModule, CqrsModule, LoggerModule],
  providers: [
    {
      provide: "KAFKA_CONFIG",
      useFactory: (configService: ConfigService) => ({
        clientId: configService.get("KAFKA_CLIENT_ID", "billing-service"),
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
        return new KafkaService("billing-service");
      },
    },
    UserCreatedConsumer,
    UsageTrackingConsumer,
  ],
  exports: ["KAFKA_SERVICE"],
})
export class KafkaModule {}
