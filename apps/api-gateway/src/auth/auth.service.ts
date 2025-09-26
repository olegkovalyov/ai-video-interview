import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException, Inject } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { OidcService } from './oidc.service';
import { KeycloakService } from './keycloak.service';
import { MetricsService } from '../metrics/metrics.service';
import { LoggerService } from '../logger/logger.service';
import { TraceService } from '../tracing/trace.service';
import { KafkaService, UserEventFactory, KAFKA_TOPICS } from '@repo/shared';

export interface LoginInitiationResult {
  success: boolean;
  authUrl?: string;
  state?: string;
  redirectUri?: string;
  error?: string;
}

export interface CallbackResult {
  success: boolean;
  expiresIn?: number;
  tokenType?: string;
  error?: string;
}

export interface RefreshResult {
  success: boolean;
  expiresIn?: number;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  endSessionEndpoint?: string;
  idToken?: string;
  requiresRedirect?: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly oidcService: OidcService,
    private readonly keycloakService: KeycloakService,
    private readonly metricsService: MetricsService,
    private readonly loggerService: LoggerService,
    private readonly traceService: TraceService,
    @Inject('KAFKA_SERVICE') private readonly kafkaService: KafkaService,
  ) {}

  /**
   * Инициирует OAuth2 login flow
   */
  async initiateLogin(redirectUri?: string): Promise<LoginInitiationResult> {
    return await this.traceService.withSpan('auth.login.initiate', async (span) => {
      try {
        const frontendOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';
        const defaultRedirectUri = `${frontendOrigin}/auth/callback`;
        const actualRedirectUri = redirectUri || defaultRedirectUri;
        
        span.setAttributes({
          'auth.flow': 'oauth2',
          'auth.redirect_uri': actualRedirectUri
        });
        
        this.loggerService.authLog('login_initiation', {
          action: 'login_start',
          redirectUri: actualRedirectUri,
          traceId: this.traceService.getTraceId()
        });
        
        const { authUrl, state } = this.keycloakService.getAuthorizationUrl(actualRedirectUri);
        
        span.setAttributes({
          'auth.state': state,
          'auth.success': true
        });
        
        this.metricsService.incrementAuthRequests('login', 'success');
        
        return {
          success: true,
          authUrl,
          state,
          redirectUri: actualRedirectUri,
        };
      } catch (error) {
        this.loggerService.error('Login initiation failed', error, {
          action: 'login_start',
          redirectUri,
          traceId: this.traceService.getTraceId()
        });
        this.metricsService.incrementAuthRequests('login', 'failure');
        
        return {
          success: false,
          error: error.message,
        };
      }
    });
  }

  /**
   * Обрабатывает OAuth2 callback
   */
  async handleCallback(
    code: string, 
    state: string, 
    redirectUri: string | undefined,
    res: Response
  ): Promise<CallbackResult> {
    return await this.traceService.withSpan('auth.callback.handle', async (span) => {
      try {
        if (!code) {
          throw new Error('Authorization code not provided');
        }

        const frontendOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';
        const defaultRedirectUri = `${frontendOrigin}/auth/callback`;
        const actualRedirectUri = redirectUri || defaultRedirectUri;
        
        span.setAttributes({
          'auth.flow': 'oauth2_callback',
          'auth.redirect_uri': actualRedirectUri,
          'auth.state': state,
          'auth.code.present': !!code
        });
        
        this.loggerService.authLog('callback_processing', {
          action: 'callback_start',
          redirectUri: actualRedirectUri,
          code: code ? 'present' : 'missing',
          traceId: this.traceService.getTraceId()
        });

        // Обменивает код на токены и получает userInfo
        const { tokens, userInfo } = await this.traceService.withSpan('auth.token.exchange', async (tokenSpan) => {
          tokenSpan.setAttributes({
            'auth.operation': 'code_exchange',
            'auth.redirect_uri': actualRedirectUri
          });
          return await this.tokenService.exchangeCodeForTokens(code, actualRedirectUri);
        });

        // Устанавливает cookies
        this.cookieService.setAuthTokensCookies(res, tokens);

        // Публикует Kafka событие
        await this.publishUserAuthenticatedEvent(userInfo, 'oauth2');
        
        span.setAttributes({
          'auth.success': true,
          'auth.user_id': userInfo.sub,
          'auth.token_type': tokens.token_type
        });
        
        this.metricsService.incrementAuthRequests('callback', 'success');
        this.metricsService.incrementUserOperations('authenticate');

        return {
          success: true,
          expiresIn: tokens.expires_in,
          tokenType: tokens.token_type,
        };
      } catch (error) {
        this.loggerService.error('Callback handling failed', error, {
          action: 'callback_failed',
          redirectUri,
          traceId: this.traceService.getTraceId()
        });
        this.metricsService.incrementAuthRequests('callback', 'failure');
        
        return {
          success: false,
          error: error.message,
        };
      }
    });
  }

  /**
   * Обновляет токены используя refresh_token из cookies или body
   */
  async refreshTokens(req: Request, res: Response, bodyRefreshToken?: string): Promise<RefreshResult> {
    try {
      this.cookieService.logCookiesDebug(req, '🔧 Refresh');

      // Получает refresh_token из body или cookies
      let refreshToken = bodyRefreshToken;
      if (!refreshToken) {
        refreshToken = this.cookieService.parseCookie(req, 'refresh_token');
      }

      if (!refreshToken) {
        this.loggerService.warn('No refresh token found in body or cookies', {
          action: 'refresh_token_missing'
        });
        return {
          success: false,
          error: 'Missing refresh token'
        };
      }

      // Обновляет токены
      const { tokens } = await this.tokenService.refreshTokens(refreshToken);

      // Устанавливает новые cookies
      this.cookieService.setAuthTokensCookies(res, tokens);

      // Публикует событие обновления токена (без userInfo)
      await this.publishTokenRefreshEvent();

      this.loggerService.authLog('token_refresh_success', {
        action: 'refresh_success'
      });
      this.metricsService.incrementAuthRequests('refresh', 'success');
      
      return {
        success: true,
        expiresIn: tokens.expires_in,
      };
    } catch (error) {
      this.loggerService.error('Token refresh failed', error, {
        action: 'refresh_failed'
      });
      this.metricsService.incrementAuthRequests('refresh', 'failure');
      
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Выполняет logout - отзывает токены и очищает cookies
   */
  async logout(req: Request, res: Response, bodyTokens?: {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }): Promise<LogoutResult> {
    try {
      // Получает токены из cookies или body
      const cookieTokens = this.cookieService.extractAuthTokens(req);
      const tokens = {
        accessToken: bodyTokens?.accessToken || cookieTokens.access_token,
        refreshToken: bodyTokens?.refreshToken || cookieTokens.refresh_token,
        idToken: bodyTokens?.idToken || cookieTokens.id_token,
      };
      
      this.loggerService.authLog('logout_token_extraction', {
        action: 'extracting_tokens_for_logout',
        from_body: {
          has_access_token: !!bodyTokens?.accessToken,
          has_refresh_token: !!bodyTokens?.refreshToken,
          has_id_token: !!bodyTokens?.idToken
        },
        from_cookies: {
          has_access_token: !!cookieTokens.access_token,
          has_refresh_token: !!cookieTokens.refresh_token,
          has_id_token: !!cookieTokens.id_token
        },
        final_tokens: {
          has_access_token: !!tokens.accessToken,
          has_refresh_token: !!tokens.refreshToken,
          has_id_token: !!tokens.idToken
        }
      });

      // Получает информацию о пользователе перед logout для Kafka события
      let userInfo: any = null;
      try {
        if (tokens.accessToken) {
          const validation = await this.tokenService.validateAccessToken(tokens.accessToken);
          if (validation.isValid) {
            userInfo = validation.payload;
          }
        }
      } catch (error) {
        this.loggerService.warn('Could not validate access token for logout event', {
          action: 'logout_token_validation_failed',
          error: error.message
        });
      }

      // 1. Отзывает токены в Keycloak (если возможно)
      await this.tokenService.revokeTokens({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      });

      // 2. Очищает cookies
      this.cookieService.clearAuthCookies(res);

      // 3. НОВОЕ: Публикует Kafka событие о logout
      await this.publishLogoutEvent(userInfo, 'user_action');

      // 4. НОВОЕ: Строит полный End Session URL с параметрами  
      this.loggerService.authLog('logout_build_end_session', {
        action: 'building_end_session_url',
        hasIdToken: !!tokens.idToken,
        idTokenPreview: tokens.idToken?.substring(0, 50) + '...'
      });
      
      const endSessionUrl = await this.buildEndSessionUrl(tokens.idToken);

      this.loggerService.authLog('logout_success', {
        action: 'logout_completed',
        hasEndSessionUrl: !!endSessionUrl,
        userId: userInfo?.sub || 'unknown'
      });
      this.metricsService.incrementAuthRequests('logout', 'success');

      return {
        success: true,
        endSessionEndpoint: endSessionUrl,
        idToken: tokens.idToken, // Для совместимости
        requiresRedirect: !!endSessionUrl, // Флаг что нужен redirect
      };
    } catch (error) {
      this.loggerService.error('Logout failed', error, {
        action: 'logout_failed'
      });
      this.metricsService.incrementAuthRequests('logout', 'failure');
      
      // При ошибках все равно пытаемся выполнить базовый logout
      try {
        this.cookieService.clearAuthCookies(res);
      } catch (clearError) {
        this.loggerService.error('Failed to clear cookies during error recovery', clearError);
      }
      
      return {
        success: true, // Возвращаем success даже при ошибках - главное очистить локальное состояние
        endSessionEndpoint: undefined,
        requiresRedirect: false,
      };
    }
  }

  /**
   * Проверяет валидность текущей сессии
   */
  async validateSession(req: Request): Promise<{ isValid: boolean; userInfo?: any; error?: string }> {
    try {
      const accessToken = this.cookieService.parseCookie(req, 'access_token');
      
      if (!accessToken) {
        return { isValid: false, error: 'No access token found' };
      }

      const validation = await this.tokenService.validateAccessToken(accessToken);
      
      return {
        isValid: validation.isValid,
        userInfo: validation.payload,
        error: validation.error
      };
    } catch (error) {
      return { 
        isValid: false, 
        error: error.message 
      };
    }
  }

  /**
   * Публикует Kafka событие logout пользователя
   */
  private async publishLogoutEvent(userInfo: any, logoutReason: 'user_action' | 'token_expired' | 'admin_action' = 'user_action'): Promise<void> {
    await this.traceService.withSpan('auth.kafka.publish_user_logout', async (span) => {
      try {
        const sessionId = userInfo?.session_id || crypto.randomUUID();
        const userLogoutEvent = UserEventFactory.createUserLoggedOut(
          userInfo?.sub || 'unknown',
          sessionId,
          logoutReason
        );
        
        span.setAttributes({
          'kafka.topic': KAFKA_TOPICS.USER_EVENTS,
          'event.type': 'user.logged_out',
          'user.id': userInfo?.sub || 'unknown',
          'logout.reason': logoutReason
        });

        await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, userLogoutEvent);
        
        this.loggerService.authLog('logout_event_published', {
          action: 'kafka_event_published',
          userId: userInfo?.sub || 'unknown',
          eventType: 'user.logged_out'
        });
      } catch (error) {
        span.recordException(error);
        this.loggerService.error('Failed to publish logout event to Kafka', error, {
          action: 'kafka_event_failed',
          userId: userInfo?.sub || 'unknown'
        });
        // Не бросаем ошибку, чтобы не прерывать logout процесс
      }
    });
  }

  /**
   * Строит URL для End Session endpoint с параметрами
   */
  private async buildEndSessionUrl(idToken?: string): Promise<string | undefined> {
    try {
      // Получаем frontend URL из конфигурации или используем дефолтный
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      // Используем Keycloak service напрямую для End Session URL
      const endSessionUrl = this.keycloakService.getEndSessionUrl(
        idToken, 
        `${frontendUrl}/`
      );
      
      this.loggerService.authLog('end_session_url_built', {
        action: 'end_session_url_prepared',
        hasIdToken: !!idToken,
        postLogoutRedirectUri: `${frontendUrl}/`,
        endSessionUrl
      });
      
      return endSessionUrl;
    } catch (error) {
      this.loggerService.error('Failed to build end session URL', error, {
        action: 'end_session_url_failed'
      });
      return undefined;
    }
  }

  /**
   * Публикует Kafka событие аутентификации пользователя
   */
  private async publishUserAuthenticatedEvent(userInfo: any, authMethod: 'oauth2' | 'jwt_refresh'): Promise<void> {
    await this.traceService.withSpan('auth.kafka.publish_user_authenticated', async (span) => {
      try {
        const sessionId = crypto.randomUUID();
        const userAuthEvent = UserEventFactory.createUserAuthenticated(
          userInfo.sub as string,
          userInfo.email as string,
          sessionId,
          { authMethod }
        );
        
        span.setAttributes({
          'kafka.topic': KAFKA_TOPICS.USER_EVENTS,
          'kafka.operation': 'publish',
          'user.id': userInfo.sub,
          'auth.method': authMethod,
          'event.type': 'user_authenticated'
        });
        
        await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, userAuthEvent);
        
        this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_EVENTS, true, {
          userId: userInfo.sub,
          authMethod,
          traceId: this.traceService.getTraceId()
        });
        
        span.setAttributes({
          'kafka.success': true
        });
      } catch (error) {
        this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_EVENTS, false, {
          error: error.message,
          authMethod,
          traceId: this.traceService.getTraceId()
        });
        
        span.setAttributes({
          'kafka.success': false,
          'kafka.error': error.message
        });
        // Не перебрасываем ошибку - проблемы с Kafka не должны блокировать аутентификацию
      }
    });
  }

  /**
   * Публикует Kafka событие обновления токена
   */
  private async publishTokenRefreshEvent(): Promise<void> {
    try {
      const sessionId = crypto.randomUUID();
      const userAuthEvent = UserEventFactory.createUserAuthenticated(
        'unknown', // userId недоступен в refresh flow
        'unknown', // email недоступен в refresh flow  
        sessionId,
        { authMethod: 'jwt_refresh' }
      );
      
      await this.kafkaService.publishEvent(KAFKA_TOPICS.USER_EVENTS, userAuthEvent);
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_EVENTS, true, {
        authMethod: 'jwt_refresh'
      });
    } catch (error) {
      this.loggerService.kafkaLog('publish', KAFKA_TOPICS.USER_EVENTS, false, {
        error: error.message,
        authMethod: 'jwt_refresh'
      });
    }
  }

  /**
   * Получает redirect URI для фронтенда
   */
  private getDefaultRedirectUri(): string {
    const frontendOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';
    return `${frontendOrigin}/auth/callback`;
  }
}
