import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from '../token.service';
import { CookieService } from '../cookie.service';
import { KeycloakService } from '../keycloak.service';
import { MetricsService } from '../../metrics/metrics.service';
import { LoggerService } from '../../logger/logger.service';
import { TraceService } from '../../tracing/trace.service';
import { SessionManager } from './session-manager.service';
import { AuthEventPublisher } from './auth-event-publisher.service';
import { RedirectUriHelper } from './redirect-uri.helper';

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

/**
 * Orchestrator для authentication flows
 * Координирует работу между всеми auth сервисами
 * Точка входа для всех auth операций
 */
@Injectable()
export class AuthOrchestrator {
  constructor(
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly keycloakService: KeycloakService,
    private readonly metricsService: MetricsService,
    private readonly loggerService: LoggerService,
    private readonly traceService: TraceService,
    private readonly sessionManager: SessionManager,
    private readonly authEventPublisher: AuthEventPublisher,
    private readonly redirectUriHelper: RedirectUriHelper,
  ) {}

  /**
   * Инициирует OAuth2 login flow
   */
  async initiateLogin(redirectUri?: string): Promise<LoginInitiationResult> {
    return await this.traceService.withSpan(
      'auth.login.initiate',
      async (span) => {
        try {
          const actualRedirectUri =
            this.redirectUriHelper.getActualRedirectUri(redirectUri);

          span.setAttributes({
            'auth.flow': 'oauth2',
            'auth.redirect_uri': actualRedirectUri,
          });

          this.loggerService.authLog('login_initiation', {
            action: 'login_start',
            redirectUri: actualRedirectUri,
            traceId: this.traceService.getTraceId(),
          });

          const { authUrl, state } =
            this.keycloakService.getAuthorizationUrl(actualRedirectUri);

          span.setAttributes({
            'auth.state': state,
            'auth.success': true,
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
            traceId: this.traceService.getTraceId(),
          });
          this.metricsService.incrementAuthRequests('login', 'failure');

          return {
            success: false,
            error: error.message,
          };
        }
      }
    );
  }

  /**
   * Инициирует OAuth2 registration flow
   */
  async initiateRegister(redirectUri?: string): Promise<LoginInitiationResult> {
    return await this.traceService.withSpan(
      'auth.register.initiate',
      async (span) => {
        try {
          const actualRedirectUri =
            this.redirectUriHelper.getActualRedirectUri(redirectUri);

          span.setAttributes({
            'auth.flow': 'oauth2_registration',
            'auth.redirect_uri': actualRedirectUri,
          });

          this.loggerService.authLog('register_initiation', {
            action: 'register_start',
            redirectUri: actualRedirectUri,
            traceId: this.traceService.getTraceId(),
          });

          const { authUrl, state } =
            this.keycloakService.getRegistrationUrl(actualRedirectUri);

          span.setAttributes({
            'auth.state': state,
            'auth.success': true,
          });

          this.metricsService.incrementAuthRequests('register', 'success');

          return {
            success: true,
            authUrl,
            state,
            redirectUri: actualRedirectUri,
          };
        } catch (error) {
          this.loggerService.error('Registration initiation failed', error, {
            action: 'register_start',
            redirectUri,
            traceId: this.traceService.getTraceId(),
          });
          this.metricsService.incrementAuthRequests('register', 'failure');

          return {
            success: false,
            error: error.message,
          };
        }
      }
    );
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
    return await this.traceService.withSpan(
      'auth.callback.handle',
      async (span) => {
        try {
          if (!code) {
            throw new Error('Authorization code not provided');
          }

          const actualRedirectUri =
            this.redirectUriHelper.getActualRedirectUri(redirectUri);

          span.setAttributes({
            'auth.flow': 'oauth2_callback',
            'auth.redirect_uri': actualRedirectUri,
            'auth.state': state,
            'auth.code.present': !!code,
          });

          this.loggerService.authLog('callback_processing', {
            action: 'callback_start',
            redirectUri: actualRedirectUri,
            code: code ? 'present' : 'missing',
            traceId: this.traceService.getTraceId(),
          });

          // Обменивает код на токены и получает userInfo
          const { tokens, userInfo } = await this.traceService.withSpan(
            'auth.token.exchange',
            async (tokenSpan) => {
              tokenSpan.setAttributes({
                'auth.operation': 'code_exchange',
                'auth.redirect_uri': actualRedirectUri,
              });
              return await this.tokenService.exchangeCodeForTokens(
                code,
                actualRedirectUri
              );
            }
          );

          // Создаёт сессию (устанавливает cookies)
          this.sessionManager.createSession(res, tokens);

          // Публикует Kafka событие
          await this.authEventPublisher.publishUserAuthenticated(
            userInfo,
            'oauth2'
          );

          span.setAttributes({
            'auth.success': true,
            'auth.user_id': userInfo.sub,
            'auth.token_type': tokens.token_type,
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
            traceId: this.traceService.getTraceId(),
          });
          this.metricsService.incrementAuthRequests('callback', 'failure');

          return {
            success: false,
            error: error.message,
          };
        }
      }
    );
  }

  /**
   * Обновляет токены используя refresh_token
   */
  async refreshTokens(
    req: Request,
    res: Response,
    bodyRefreshToken?: string
  ): Promise<RefreshResult> {
    try {
      this.cookieService.logCookiesDebug(req, '🔧 Refresh');

      // Получает refresh_token из body или cookies
      let refreshToken = bodyRefreshToken;
      if (!refreshToken) {
        refreshToken = this.cookieService.parseCookie(req, 'refresh_token');
      }

      if (!refreshToken) {
        this.loggerService.warn('No refresh token found in body or cookies', {
          action: 'refresh_token_missing',
        });
        return {
          success: false,
          error: 'Missing refresh token',
        };
      }

      // Обновляет токены
      const { tokens } = await this.tokenService.refreshTokens(refreshToken);

      // Создаёт новую сессию с обновлёнными токенами
      this.sessionManager.createSession(res, tokens);

      // Логирует refresh (не публикуем событие)
      this.authEventPublisher.logTokenRefresh();

      this.loggerService.authLog('token_refresh_success', {
        action: 'refresh_success',
      });
      this.metricsService.incrementAuthRequests('refresh', 'success');

      return {
        success: true,
        expiresIn: tokens.expires_in,
      };
    } catch (error) {
      this.loggerService.error('Token refresh failed', error, {
        action: 'refresh_failed',
      });
      this.metricsService.incrementAuthRequests('refresh', 'failure');

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Выполняет logout
   */
  async logout(
    req: Request,
    res: Response,
    bodyTokens?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
    }
  ): Promise<LogoutResult> {
    try {
      // Уничтожаем сессию
      const result = await this.sessionManager.destroySession(
        req,
        res,
        bodyTokens
      );

      // Публикуем Kafka событие
      if ((result as any).userInfo) {
        await this.authEventPublisher.publishUserLoggedOut(
          (result as any).userInfo,
          'user_action'
        );
      }

      this.metricsService.incrementAuthRequests('logout', 'success');

      return {
        success: result.success,
        endSessionEndpoint: result.endSessionEndpoint,
        idToken: result.idToken,
        requiresRedirect: result.requiresRedirect,
      };
    } catch (error) {
      this.loggerService.error('Logout failed', error, {
        action: 'logout_failed',
      });
      this.metricsService.incrementAuthRequests('logout', 'failure');

      // При ошибках всё равно очищаем сессию
      try {
        this.sessionManager.clearSession(res);
      } catch (clearError) {
        this.loggerService.error(
          'Failed to clear session during error recovery',
          clearError
        );
      }

      return {
        success: true,
        endSessionEndpoint: undefined,
        requiresRedirect: false,
      };
    }
  }

  /**
   * Валидирует текущую сессию
   */
  async validateSession(req: Request): Promise<{
    isValid: boolean;
    userInfo?: any;
    error?: string;
  }> {
    return await this.sessionManager.validateSession(req);
  }
}
