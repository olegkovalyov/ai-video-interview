import {
  Controller,
  MessageEvent,
  Sse,
  UseGuards,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Observable, Subject, filter, map } from 'rxjs';
import Redis from 'ioredis';
import { JwtAuthGuard } from '../../../core/auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  CurrentUserData,
} from '../../../core/auth/decorators/current-user.decorator';
import { LoggerService } from '../../../core/logging/logger.service';

interface NotificationEvent {
  userId: string;
  payload: Record<string, unknown>;
}

/**
 * SSE Controller for real-time notifications
 * Uses Server-Sent Events to push notifications from Redis pub/sub to connected clients.
 * Subscribes to Redis channel `notifications:{userId}` and forwards messages.
 */
@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('api/notifications')
export class SseController implements OnModuleInit, OnModuleDestroy {
  private subscriber: Redis;
  private readonly events$ = new Subject<NotificationEvent>();

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.subscriber = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: parseInt(this.configService.get('REDIS_PORT', '6379'), 10),
      password: this.configService.get('REDIS_PASSWORD') || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => {
        if (times > 10) return null;
        return Math.min(times * 50, 2000);
      },
    });
  }

  async onModuleInit() {
    // Subscribe to all user notification channels with pattern
    await this.subscriber.psubscribe('notifications:*');

    this.subscriber.on('pmessage', (_pattern, channel, message) => {
      const userId = channel.replace('notifications:', '');
      try {
        const payload = JSON.parse(message);
        this.events$.next({ userId, payload });
      } catch (error) {
        this.logger.error('Failed to parse notification message', error, {
          action: 'sse.parse_error',
          channel,
        });
      }
    });

    this.logger.info('SSE subscriber connected to Redis pub/sub', {
      action: 'sse.init',
      pattern: 'notifications:*',
    });
  }

  async onModuleDestroy() {
    await this.subscriber.quit();
    this.events$.complete();
  }

  /**
   * GET /api/notifications/stream
   * SSE endpoint — pushes real-time notifications for the authenticated user.
   */
  @Sse('stream')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Subscribe to real-time notifications via Server-Sent Events',
  })
  stream(@CurrentUser() user: CurrentUserData): Observable<MessageEvent> {
    this.logger.debug('SSE client connected', {
      action: 'sse.connect',
      userId: user.userId,
    });

    return this.events$.pipe(
      filter((event) => event.userId === user.userId),
      map((event) => ({
        data: event.payload,
      })),
    );
  }
}
