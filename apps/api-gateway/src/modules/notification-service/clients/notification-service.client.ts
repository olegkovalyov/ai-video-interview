import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { BaseServiceProxy } from '../../../proxies/base/base-service-proxy';
import { LoggerService } from '../../../core/logging/logger.service';
import { MetricsService } from '../../../core/metrics/metrics.service';
import { CircuitBreakerRegistry } from '../../../core/circuit-breaker/circuit-breaker-registry.service';

export interface NotificationDto {
  id: string;
  recipientId: string;
  recipientEmail: string;
  channel: 'email' | 'in_app' | 'webhook';
  template: string;
  status: 'pending' | 'queued' | 'sent' | 'failed' | 'bounced';
  data: Record<string, unknown>;
  sentAt: string | null;
  error: string | null;
  retryCount: number;
  createdAt: string;
}

export interface NotificationListDto {
  items: NotificationDto[];
  total: number;
  limit: number;
  offset: number;
}

export interface PreferencesDto {
  userId: string;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  subscriptions: Record<string, boolean>;
  updatedAt: string;
}

export interface UpdatePreferencesBody {
  emailEnabled?: boolean;
  inAppEnabled?: boolean;
  subscriptions?: Record<string, boolean>;
}

/**
 * Notification Service Client
 * Proxies requests to notification-service (port 8006).
 */
@Injectable()
export class NotificationServiceClient extends BaseServiceProxy {
  protected readonly serviceName = 'notification-service';
  protected readonly baseUrl: string;
  private readonly internalToken: string;

  protected circuitBreakerOptions = {
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 5000,
    resetTimeout: 60000,
  };

  constructor(
    httpService: HttpService,
    loggerService: LoggerService,
    metricsService: MetricsService,
    circuitBreakerRegistry: CircuitBreakerRegistry,
    private readonly configService: ConfigService,
  ) {
    super(httpService, loggerService, metricsService, circuitBreakerRegistry);
    this.baseUrl =
      this.configService.get<string>('NOTIFICATION_SERVICE_URL') ||
      'http://localhost:8006';
    this.internalToken =
      this.configService.get<string>('INTERNAL_SERVICE_TOKEN') || '';
    this.initCircuitBreaker();
  }

  protected getDefaultHeaders(): Record<string, string> {
    return {
      ...super.getDefaultHeaders(),
      'x-internal-token': this.internalToken,
    };
  }

  async listNotifications(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<NotificationListDto> {
    return this.get<NotificationListDto>('/api/notifications', {
      headers: { 'x-user-id': userId },
      params: { limit, offset },
    });
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    return this.get<{ count: number }>('/api/notifications/unread-count', {
      headers: { 'x-user-id': userId },
    });
  }

  async markNotificationRead(
    notificationId: string,
    userId: string,
  ): Promise<{ success: boolean }> {
    return this.post<{ success: boolean }>(
      `/api/notifications/${notificationId}/read`,
      {},
      { headers: { 'x-user-id': userId } },
    );
  }

  async getPreferences(userId: string): Promise<PreferencesDto> {
    return this.get<PreferencesDto>('/api/preferences', {
      headers: { 'x-user-id': userId },
    });
  }

  async updatePreferences(
    userId: string,
    dto: UpdatePreferencesBody,
  ): Promise<{ success: boolean }> {
    return this.put<{ success: boolean }>('/api/preferences', dto, {
      headers: { 'x-user-id': userId },
    });
  }
}
