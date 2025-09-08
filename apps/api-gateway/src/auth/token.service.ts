import { Injectable, Logger } from '@nestjs/common';
import { AuthentikService } from './authentik.service';
import { OidcService } from './oidc.service';

export interface TokenPair {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface TokenRefreshResult {
  tokens: TokenPair;
  userInfo?: any | null;
}

export interface TokenValidationResult {
  isValid: boolean;
  payload?: any;
  error?: string;
}

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly authentikService: AuthentikService,
    private readonly oidcService: OidcService,
  ) {}

  /**
   * Обменивает authorization code на токены
   */
  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<TokenRefreshResult> {
    try {
      this.logger.debug(`Exchanging code for tokens with redirect_uri: ${redirectUri}`);
      
      const tokens = await this.authentikService.exchangeCodeForTokens(code, redirectUri);
      
      this.logger.debug('Tokens received from Authentik:', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        has_id_token: !!tokens.id_token,
        expires_in: tokens.expires_in
      });

      // Проверяем и получаем информацию о пользователе
      let userInfo: any = null;
      try {
        const { payload } = await this.oidcService.verifyAccessToken(tokens.access_token);
        userInfo = payload;
      } catch (error) {
        this.logger.warn('Failed to verify access token during exchange:', error.message);
        throw new Error('Invalid access token received from Authentik');
      }

      return {
        tokens,
        userInfo: userInfo || null
      };
    } catch (error) {
      this.logger.error('Token exchange failed:', error.message);
      throw error;
    }
  }

  /**
   * Обновляет токены используя refresh_token
   */
  async refreshTokens(refreshToken: string): Promise<TokenRefreshResult> {
    try {
      this.logger.debug('Refreshing tokens using refresh_token');
      
      const tokens = await this.authentikService.refreshToken(refreshToken);
      
      this.logger.debug('Refresh completed successfully', {
        has_access_token: !!tokens.access_token,
        has_refresh_token: !!tokens.refresh_token,
        expires_in: tokens.expires_in
      });

      return {
        tokens
        // Для refresh flow не проверяем userInfo чтобы избежать лишних запросов
      };
    } catch (error) {
      this.logger.error('Token refresh failed:', error.message);
      throw error;
    }
  }

  /**
   * Валидирует access_token
   */
  async validateAccessToken(accessToken: string): Promise<TokenValidationResult> {
    try {
      const { payload } = await this.oidcService.verifyAccessToken(accessToken);
      return {
        isValid: true,
        payload
      };
    } catch (error) {
      this.logger.warn('Access token validation failed:', error.message);
      return {
        isValid: false,
        error: error.message
      };
    }
  }

  /**
   * Отзывает токены (для logout)
   */
  async revokeTokens(tokens: { accessToken?: string; refreshToken?: string }): Promise<void> {
    const revokePromises: Promise<void>[] = [];

    if (tokens.refreshToken) {
      revokePromises.push(
        this.oidcService.revokeToken(tokens.refreshToken, 'refresh_token')
          .catch(error => this.logger.warn('Failed to revoke refresh_token:', error.message))
      );
    }

    if (tokens.accessToken) {
      revokePromises.push(
        this.oidcService.revokeToken(tokens.accessToken, 'access_token')
          .catch(error => this.logger.warn('Failed to revoke access_token:', error.message))
      );
    }

    // Ждем завершения всех операций отзыва, но не падаем при ошибках
    await Promise.allSettled(revokePromises);
    this.logger.debug('Token revocation completed');
  }

  /**
   * Получает информацию о пользователе из access_token
   */
  async getUserInfoFromToken(accessToken: string): Promise<any> {
    const validation = await this.validateAccessToken(accessToken);
    if (!validation.isValid) {
      throw new Error('Invalid access token');
    }
    return validation.payload;
  }

  /**
   * Проверяет истек ли токен (по exp claim)
   */
  isTokenExpired(token: string): boolean {
    try {
      // Простая проверка без верификации подписи (только для exp)
      const [, payloadBase64] = token.split('.');
      if (!payloadBase64) return true;
      
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      
      return !payload.exp || payload.exp < now;
    } catch {
      return true; // Если не можем парсить - считаем истекшим
    }
  }

  /**
   * Получает время жизни токена в секундах
   */
  getTokenTtl(token: string): number | null {
    try {
      const [, payloadBase64] = token.split('.');
      if (!payloadBase64) return null;
      
      const payload = JSON.parse(Buffer.from(payloadBase64, 'base64').toString());
      const now = Math.floor(Date.now() / 1000);
      
      return payload.exp ? Math.max(0, payload.exp - now) : null;
    } catch {
      return null;
    }
  }
}
