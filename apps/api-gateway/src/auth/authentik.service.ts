import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthentikService {
  private readonly authentikUrl: string;
  private readonly authentikToken: string;
  private readonly authentikAppSlug: string;

  constructor(private configService: ConfigService) {
    this.authentikUrl = this.configService.get('AUTHENTIK_URL', 'http://localhost:9443');
    this.authentikToken = this.configService.get('AUTHENTIK_TOKEN', '');
    this.authentikAppSlug = this.configService.get('AUTHENTIK_APP_SLUG', 'ai-interview-app');
  }

  /**
   * Регистрация нового пользователя через Authentik API
   */
  async registerUser(userData: { email: string; password: string; firstName?: string; lastName?: string }) {
    console.log('🔧 AuthentikService registerUser called with:', { 
      email: userData.email,
      hasPassword: !!userData.password,
      authentikUrl: this.authentikUrl,
      hasToken: !!this.authentikToken,
      tokenPreview: this.authentikToken ? this.authentikToken.substring(0, 10) + '...' : 'none'
    });

    const requestBody = {
      username: userData.email,
      email: userData.email,
      name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
      is_active: true,
    };

    console.log('🔧 Making request to Authentik API:', `${this.authentikUrl}/api/v3/core/users/`);
    console.log('🔧 Request body:', requestBody);

    const response = await fetch(`${this.authentikUrl}/api/v3/core/users/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authentikToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('🔧 Authentik response status:', response.status, response.statusText);

    if (!response.ok) {
      const error = await response.json();
      console.log('❌ Authentik API error:', error);
      throw new Error(`Failed to register user: ${JSON.stringify(error)}`);
    }

    const user = await response.json();
    
    // Set password
    await fetch(`${this.authentikUrl}/api/v3/core/users/${user.pk}/set_password/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authentikToken}`,
      },
      body: JSON.stringify({
        password: userData.password,
      }),
    });

    return user;
  }

  /**
   * Генерирует URL для Authorization Code flow
   */
  getAuthorizationUrl(redirectUri: string, state?: string) {
    const clientId = this.configService.get('AUTHENTIK_CLIENT_ID', '');
    
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'openid profile email',
      state: state || Math.random().toString(36).substring(2, 15),
    });

    const authUrl = `${this.authentikUrl}/application/o/authorize/?${params.toString()}`;
    console.log('🔧 Generated authorization URL:', authUrl);
    
    return {
      authUrl,
      state: params.get('state'),
    };
  }

  /**
   * Обмен authorization code на токены (Authorization Code flow)
   */
  async exchangeCodeForTokens(code: string, redirectUri: string) {
    console.log('🔧 Exchanging authorization code for tokens');
    
    const clientId = this.configService.get('AUTHENTIK_CLIENT_ID', '');
    const clientSecret = this.configService.get('AUTHENTIK_CLIENT_SECRET', '');

    const response = await fetch(`${this.authentikUrl}/application/o/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    console.log('🔧 Token exchange response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Token exchange error:', errorText);
      
      let errorObj;
      try {
        errorObj = JSON.parse(errorText);
      } catch {
        errorObj = { error: 'unknown_error', error_description: errorText };
      }
      
      throw new Error(`Token exchange failed: ${JSON.stringify(errorObj)}`);
    }

    const tokens = await response.json();
    console.log('🔧 Successfully exchanged code for tokens');
    
    return tokens;
  }

  /**
   * Refresh токена
   */
  async refreshToken(refreshToken: string) {
    const clientId = this.configService.get('AUTHENTIK_CLIENT_ID', '');
    const clientSecret = this.configService.get('AUTHENTIK_CLIENT_SECRET', '');
    
    const response = await fetch(`${this.authentikUrl}/application/o/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Token refresh failed: ${JSON.stringify(error)}`);
    }

    return await response.json();
  }

  /**
   * Получение JWKS для валидации токенов
   */
  async getJWKS() {
    const response = await fetch(`${this.authentikUrl}/application/o/${this.authentikAppSlug}/.well-known/jwks.json`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch JWKS');
    }

    return await response.json();
  }
}
