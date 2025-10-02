import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class KeycloakService {
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly logger = new Logger(KeycloakService.name);

  constructor(private configService: ConfigService) {
    this.keycloakUrl = this.configService.get('KEYCLOAK_URL', 'http://localhost:8090');
    this.realm = this.configService.get('KEYCLOAK_REALM', 'ai-video-interview');
    this.clientId = this.configService.get('KEYCLOAK_CLIENT_ID', 'ai-video-interview-app');
    this.clientSecret = this.configService.get('KEYCLOAK_CLIENT_SECRET', '');
  }

  /**
   * Генерирует URL для авторизации через Keycloak
   */
  getAuthorizationUrl(redirectUri: string): { authUrl: string; state: string } {
    const state = crypto.randomUUID();
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      redirect_uri: redirectUri,
      state: state,
      scope: 'openid profile email',
    });

    const authUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/auth?${params.toString()}`;
    
    this.logger.debug('Generated Keycloak authorization URL:', {
      authUrl,
      redirectUri,
      state,
      clientId: this.clientId
    });
    
    return { authUrl, state };
  }

  /**
   * Генерирует URL для регистрации через Keycloak
   * Использует отдельный registration endpoint Keycloak
   */
  getRegistrationUrl(redirectUri: string): { authUrl: string; state: string } {
    const state = crypto.randomUUID();
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      scope: 'openid profile email',
      redirect_uri: redirectUri,
    });

    // Keycloak registration endpoint - прямой путь к форме регистрации
    const authUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/registrations?${params.toString()}`;
    
    this.logger.debug('Generated Keycloak registration URL:', {
      authUrl,
      redirectUri,
      state,
      clientId: this.clientId,
      action: 'register'
    });
    
    return { authUrl, state };
  }

  /**
   * Обменивает authorization code на токены
   */
  async exchangeCodeForTokens(code: string, redirectUri: string) {
    this.logger.debug('Exchanging authorization code for tokens', {
      codeLength: code?.length || 0,
      redirectUri
    });
    
    const tokenEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      code: code,
      redirect_uri: redirectUri,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('Token exchange failed:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      throw new Error(`Token exchange failed: ${response.status} ${response.statusText}`);
    }

    const tokens = await response.json();
    
    this.logger.debug('Token exchange successful:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      has_id_token: !!tokens.id_token,
      expires_in: tokens.expires_in
    });

    return tokens;
  }

  /**
   * Обновляет токены используя refresh_token
   */
  async refreshToken(refreshToken: string) {
    this.logger.debug('Refreshing tokens');
    
    const tokenEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`;
    
    const body = new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
    });

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('Token refresh failed:', {
        status: response.status,
        statusText: response.statusText,
        error,
        refreshTokenLength: refreshToken?.length,
        refreshTokenStart: refreshToken?.substring(0, 20) + '...'
      });
      
      // Парсим ошибку от Keycloak для лучшей диагностики
      try {
        const errorObj = JSON.parse(error);
        this.logger.error('Keycloak error details:', errorObj);
        
        if (errorObj.error === 'invalid_grant') {
          this.logger.warn('Refresh token is invalid or expired - требуется новый login');
        }
      } catch (parseError) {
        this.logger.debug('Could not parse Keycloak error response');
      }
      
      throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
    }

    const tokens = await response.json();
    
    this.logger.debug('Token refresh successful:', {
      has_access_token: !!tokens.access_token,
      has_refresh_token: !!tokens.refresh_token,
      expires_in: tokens.expires_in
    });

    return tokens;
  }

  /**
   * Отзывает токен (для logout)
   */
  async revokeToken(token: string, tokenTypeHint?: 'access_token' | 'refresh_token') {
    this.logger.debug('Revoking token', { tokenTypeHint });
    
    const revokeEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/revoke`;
    
    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      token: token,
    });

    if (tokenTypeHint) {
      body.append('token_type_hint', tokenTypeHint);
    }

    const response = await fetch(revokeEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.warn('Token revocation failed (non-critical):', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      // Не бросаем ошибку, так как это не критично
    } else {
      this.logger.debug('Token revocation successful');
    }
  }

  /**
   * Получает URL для End Session (logout)
   * ВАЖНО: id_token_hint обязателен для Keycloak!
   */
  getEndSessionUrl(idToken?: string, postLogoutRedirectUri?: string): string {
    const params = new URLSearchParams();
    
    // КРИТИЧНО: Keycloak требует id_token_hint для logout
    if (idToken) {
      params.append('id_token_hint', idToken);
    } else {
      this.logger.warn('⚠️  Building End Session URL WITHOUT id_token_hint - Keycloak may reject this!', {
        hasPostLogoutRedirectUri: !!postLogoutRedirectUri,
        recommendation: 'Ensure id_token cookie is properly set and not expired'
      });
    }
    
    if (postLogoutRedirectUri) {
      params.append('post_logout_redirect_uri', postLogoutRedirectUri);
    }

    const endSessionUrl = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout?${params.toString()}`;
    
    this.logger.debug('Generated End Session URL:', {
      endSessionUrl,
      hasIdToken: !!idToken,
      postLogoutRedirectUri,
      warning: !idToken ? 'Missing id_token_hint' : undefined
    });
    
    return endSessionUrl;
  }

  /**
   * Получает JWKS для верификации токенов
   */
  async getJWKS() {
    this.logger.debug('Fetching JWKS from Keycloak');
    
    const jwksEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/certs`;
    
    const response = await fetch(jwksEndpoint);
    
    if (!response.ok) {
      const error = await response.text();
      this.logger.error('JWKS fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      throw new Error(`JWKS fetch failed: ${response.status} ${response.statusText}`);
    }

    const jwks = await response.json();
    
    this.logger.debug('JWKS fetched successfully:', {
      keysCount: jwks.keys?.length || 0
    });

    return jwks;
  }

  /**
   * Получает информацию о пользователе из UserInfo endpoint
   */
  async getUserInfo(accessToken: string) {
    this.logger.debug('Fetching user info from Keycloak');
    
    const userInfoEndpoint = `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/userinfo`;
    
    const response = await fetch(userInfoEndpoint, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      this.logger.error('UserInfo fetch failed:', {
        status: response.status,
        statusText: response.statusText,
        error
      });
      throw new Error(`UserInfo fetch failed: ${response.status} ${response.statusText}`);
    }

    const userInfo = await response.json();
    
    this.logger.debug('UserInfo fetched successfully:', {
      sub: userInfo.sub,
      email: userInfo.email,
      preferred_username: userInfo.preferred_username
    });

    return userInfo;
  }
}
