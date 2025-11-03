import { Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { TokenService } from './token.service';
import { CookieService } from './cookie.service';
import { KeycloakService } from './keycloak.service';
import { LoggerService } from '../../logging/logger.service';
import { RedirectUriHelper } from './redirect-uri.helper';

export interface SessionValidationResult {
  isValid: boolean;
  userInfo?: any;
  error?: string;
}

export interface LogoutResult {
  success: boolean;
  endSessionEndpoint?: string;
  idToken?: string;
  requiresRedirect?: boolean;
}

/**
 * Управление пользовательскими сессиями
 * Валидация, создание, уничтожение сессий
 */
@Injectable()
export class SessionManager {
  constructor(
    private readonly tokenService: TokenService,
    private readonly cookieService: CookieService,
    private readonly keycloakService: KeycloakService,
    private readonly loggerService: LoggerService,
    private readonly redirectUriHelper: RedirectUriHelper,
  ) {}

  /**
   * Валидирует текущую сессию пользователя
   */
  async validateSession(req: Request): Promise<SessionValidationResult> {
    try {
      const accessToken = this.cookieService.parseCookie(req, 'access_token');

      if (!accessToken) {
        return { isValid: false, error: 'No access token found' };
      }

      const validation = await this.tokenService.validateAccessToken(accessToken);

      return {
        isValid: validation.isValid,
        userInfo: validation.payload,
        error: validation.error,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Создаёт новую сессию после успешной аутентификации
   * Устанавливает cookies с токенами
   */
  createSession(res: Response, tokens: any): void {
    this.cookieService.setAuthTokensCookies(res, tokens);
    this.loggerService.debug('Session created', {
      category: 'auth',
      action: 'session_created',
    });
  }

  /**
   * Уничтожает сессию пользователя (logout)
   * Отзывает токены, очищает cookies, строит End Session URL
   */
  async destroySession(
    req: Request,
    res: Response,
    bodyTokens?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
    }
  ): Promise<LogoutResult> {
    try {
      // 1. Извлекаем токены из cookies или body
      const tokens = this.extractTokens(req, bodyTokens);

      this.logTokenExtraction(tokens, bodyTokens);

      // 2. Получаем userInfo перед logout для событий
      const userInfo = await this.getUserInfoBeforeLogout(tokens.accessToken);

      // 3. Отзываем токены в Keycloak
      await this.revokeTokens(tokens);

      // 4. Очищаем cookies
      this.clearSession(res);

      // 5. Строим End Session URL
      const endSessionUrl = this.buildEndSessionUrl(tokens.idToken);

      this.loggerService.authLog('logout_success', {
        action: 'logout_completed',
        hasEndSessionUrl: !!endSessionUrl,
        userId: userInfo?.sub || 'unknown',
      });

      return {
        success: true,
        endSessionEndpoint: endSessionUrl,
        idToken: tokens.idToken,
        requiresRedirect: !!endSessionUrl,
        userInfo, // Для Kafka событий
      } as any;
    } catch (error) {
      this.loggerService.error('Session destruction failed', error, {
        action: 'logout_failed',
      });

      // При ошибках всё равно очищаем локальное состояние
      try {
        this.clearSession(res);
      } catch (clearError) {
        this.loggerService.error(
          'Failed to clear cookies during error recovery',
          clearError
        );
      }

      return {
        success: true, // Возвращаем success даже при ошибках
        endSessionEndpoint: undefined,
        requiresRedirect: false,
      };
    }
  }

  /**
   * Очищает сессию (cookies)
   */
  clearSession(res: Response): void {
    this.cookieService.clearAuthCookies(res);
    this.loggerService.debug('Session cleared', {
      category: 'auth',
      action: 'session_cleared',
    });
  }

  /**
   * Извлекает токены из request и body
   */
  private extractTokens(
    req: Request,
    bodyTokens?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
    }
  ): {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  } {
    const cookieTokens = this.cookieService.extractAuthTokens(req);

    return {
      accessToken: bodyTokens?.accessToken || cookieTokens.access_token,
      refreshToken: bodyTokens?.refreshToken || cookieTokens.refresh_token,
      idToken: bodyTokens?.idToken || cookieTokens.id_token,
    };
  }

  /**
   * Получает userInfo перед logout
   */
  private async getUserInfoBeforeLogout(
    accessToken?: string
  ): Promise<any | null> {
    if (!accessToken) {
      return null;
    }

    try {
      const validation = await this.tokenService.validateAccessToken(accessToken);
      return validation.isValid ? validation.payload : null;
    } catch (error) {
      this.loggerService.warn(
        'Could not validate access token for logout event',
        {
          action: 'logout_token_validation_failed',
          error: error.message,
        }
      );
      return null;
    }
  }

  /**
   * Отзывает токены в Keycloak
   */
  private async revokeTokens(tokens: {
    accessToken?: string;
    refreshToken?: string;
  }): Promise<void> {
    await this.tokenService.revokeTokens({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    });
  }

  /**
   * Строит URL для End Session endpoint
   */
  private buildEndSessionUrl(idToken?: string): string | undefined {
    try {
      if (!idToken) {
        this.loggerService.warn(
          'ID Token is missing for logout. Keycloak logout may fail.',
          {
            action: 'logout_missing_id_token',
            suggestion: 'User may need to re-login if Keycloak session persists',
          }
        );
        return undefined;
      }

      const postLogoutRedirectUri =
        this.redirectUriHelper.getPostLogoutRedirectUri();

      const endSessionUrl = this.keycloakService.getEndSessionUrl(
        idToken,
        postLogoutRedirectUri
      );

      this.loggerService.authLog('end_session_url_built', {
        action: 'end_session_url_prepared',
        hasIdToken: !!idToken,
        postLogoutRedirectUri,
        endSessionUrl,
      });

      return endSessionUrl;
    } catch (error) {
      this.loggerService.error('Failed to build end session URL', error, {
        action: 'end_session_url_failed',
      });
      return undefined;
    }
  }

  /**
   * Логирует извлечение токенов
   */
  private logTokenExtraction(
    tokens: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
    },
    bodyTokens?: {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
    }
  ): void {
    this.loggerService.authLog('logout_token_extraction', {
      action: 'extracting_tokens_for_logout',
      from_body: {
        has_access_token: !!bodyTokens?.accessToken,
        has_refresh_token: !!bodyTokens?.refreshToken,
        has_id_token: !!bodyTokens?.idToken,
      },
      final_tokens: {
        has_access_token: !!tokens.accessToken,
        has_refresh_token: !!tokens.refreshToken,
        has_id_token: !!tokens.idToken,
      },
    });
  }
}
