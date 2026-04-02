import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";
import { LoggerService } from "../logger/logger.service";
import { MetricsService } from "../metrics/metrics.service";

/**
 * RealtimeService
 * Publishes in-app notifications to Redis pub/sub channels.
 * The API Gateway WebSocket server subscribes to these channels
 * and forwards notifications to connected clients.
 */
@Injectable()
export class RealtimeService {
  private publisher: Redis;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
    private readonly metricsService: MetricsService,
  ) {
    this.publisher = new Redis({
      host: this.configService.get("REDIS_HOST", "localhost"),
      port: parseInt(this.configService.get("REDIS_PORT", "6379"), 10),
      password: this.configService.get("REDIS_PASSWORD") || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(times * 50, 2000);
      },
    });

    this.publisher.on("error", (error) => {
      this.logger.error("Redis pub/sub connection error", error, {
        action: "realtime.redis_error",
      });
    });
  }

  async publishToUser(
    userId: string,
    notification: Record<string, unknown>,
  ): Promise<void> {
    try {
      const channel = `notifications:${userId}`;
      const message = JSON.stringify(notification);

      await this.publisher.publish(channel, message);
      this.metricsService.recordInAppPushed();

      this.logger.debug(`Published notification to ${channel}`, {
        action: "realtime.publish",
        userId,
      });
    } catch (error) {
      this.logger.error("Failed to publish realtime notification", error, {
        action: "realtime.publish_failed",
        userId,
      });
    }
  }
}
