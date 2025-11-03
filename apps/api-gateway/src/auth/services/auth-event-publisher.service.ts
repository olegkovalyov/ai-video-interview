import { Injectable, Inject } from '@nestjs/common';
import { KafkaService, AuthEventFactory, KAFKA_TOPICS } from '@repo/shared';
import { LoggerService } from '../../core/logging/logger.service';
import { TraceService } from '../../core/tracing/trace.service';
import * as crypto from 'crypto';

export type AuthMethod = 'oauth2' | 'jwt_refresh';
export type LogoutReason = 'user_action' | 'token_expired' | 'admin_action';

/**
 * Сервис для публикации authentication-related событий в Kafka
 * Изолирует логику событийной системы от основного auth flow
 */
@Injectable()
export class AuthEventPublisher {
  constructor(
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
    private readonly loggerService: LoggerService,
    private readonly traceService: TraceService,
  ) {}

  /**
   * Публикует событие успешной аутентификации пользователя
   */
  async publishUserAuthenticated(
    userInfo: any,
    authMethod: AuthMethod
  ): Promise<void> {
    await this.traceService.withSpan(
      'auth.kafka.publish_user_authenticated',
      async (span) => {
        try {
          const sessionId = crypto.randomUUID();

          // Extract firstName/lastName from Keycloak userInfo
          // Keycloak uses given_name and family_name as standard OIDC claims
          const firstName =
            userInfo.given_name ||
            userInfo.firstName ||
            userInfo.name?.split(' ')[0];
          const lastName =
            userInfo.family_name ||
            userInfo.lastName ||
            userInfo.name?.split(' ')[1];

          const userAuthEvent = AuthEventFactory.createUserAuthenticated(
            userInfo.sub as string,
            userInfo.email as string,
            sessionId,
            {
              authMethod,
              firstName,
              lastName,
            }
          );

          span.setAttributes({
            'kafka.topic': KAFKA_TOPICS.AUTH_EVENTS,
            'kafka.operation': 'publish',
            'user.id': userInfo.sub,
            'auth.method': authMethod,
            'event.type': 'user.authenticated',
          });

          await this.kafkaService.publishEvent(
            KAFKA_TOPICS.AUTH_EVENTS,
            userAuthEvent
          );

          this.loggerService.kafkaLog('publish', KAFKA_TOPICS.AUTH_EVENTS, true, {
            userId: userInfo.sub,
            authMethod,
            hasUserName: !!(firstName && lastName),
            traceId: this.traceService.getTraceId(),
          });

          span.setAttributes({
            'kafka.success': true,
          });
        } catch (error) {
          this.loggerService.kafkaLog('publish', KAFKA_TOPICS.AUTH_EVENTS, false, {
            error: error.message,
            authMethod,
            traceId: this.traceService.getTraceId(),
          });

          span.setAttributes({
            'kafka.success': false,
            'kafka.error': error.message,
          });
          
          // Не перебрасываем ошибку - проблемы с Kafka не должны блокировать аутентификацию
          this.loggerService.warn(
            'Failed to publish user authenticated event, but auth flow continues',
            { error: error.message }
          );
        }
      }
    );
  }

  /**
   * Публикует событие logout пользователя
   */
  async publishUserLoggedOut(
    userInfo: any,
    logoutReason: LogoutReason = 'user_action'
  ): Promise<void> {
    await this.traceService.withSpan(
      'auth.kafka.publish_user_logout',
      async (span) => {
        try {
          const sessionId = userInfo?.session_id || crypto.randomUUID();
          const userLogoutEvent = AuthEventFactory.createUserLoggedOut(
            userInfo?.sub || 'unknown',
            sessionId,
            logoutReason
          );

          span.setAttributes({
            'kafka.topic': KAFKA_TOPICS.AUTH_EVENTS,
            'event.type': 'user.logged_out',
            'user.id': userInfo?.sub || 'unknown',
            'logout.reason': logoutReason,
          });

          await this.kafkaService.publishEvent(
            KAFKA_TOPICS.AUTH_EVENTS,
            userLogoutEvent
          );

          this.loggerService.kafkaLog('publish', KAFKA_TOPICS.AUTH_EVENTS, true, {
            userId: userInfo?.sub || 'unknown',
            eventType: 'user.logged_out',
            logoutReason,
          });
        } catch (error) {
          span.recordException(error);
          this.loggerService.kafkaLog('publish', KAFKA_TOPICS.AUTH_EVENTS, false, {
            error: error.message,
            userId: userInfo?.sub || 'unknown',
            eventType: 'user.logged_out',
          });
          
          // Не бросаем ошибку, чтобы не прерывать logout процесс
          this.loggerService.warn(
            'Failed to publish logout event, but logout flow continues',
            { error: error.message }
          );
        }
      }
    );
  }

  /**
   * Логирует token refresh (не публикуем событие)
   */
  logTokenRefresh(): void {
    // НЕ публикуем событие для refresh токенов
    // Refresh не создаёт нового юзера, это просто продление сессии
    // userId и email недоступны в refresh flow, поэтому событие бесполезно
    this.loggerService.debug('Token refresh - no Kafka event published', {
      category: 'auth',
      authMethod: 'jwt_refresh',
      reason: 'Refresh does not create users',
    });
  }
}
