import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationServiceClient } from './clients/notification-service.client';
import { NotificationsController } from './controllers/notifications.controller';
import { PreferencesController } from './controllers/preferences.controller';
import { SseController } from './controllers/sse.controller';

/**
 * Notification Service Module
 * Proxies requests to notification-service (port 8006).
 * NotificationServiceClient extends BaseServiceProxy — circuit breaker (5s timeout), retry, metrics.
 * SseController — Server-Sent Events endpoint for real-time notifications (Redis pub/sub subscriber).
 *
 * Dependencies (via @Global modules): LoggerService, MetricsService, CircuitBreakerRegistry
 */
@Module({
  imports: [HttpModule],
  controllers: [NotificationsController, PreferencesController, SseController],
  providers: [NotificationServiceClient],
  exports: [NotificationServiceClient],
})
export class NotificationServiceModule {}
