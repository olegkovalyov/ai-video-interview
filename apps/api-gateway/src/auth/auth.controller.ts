import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthentikService } from './authentik.service';

interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

interface LoginDto {
  email: string;
  password: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authentikService: AuthentikService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    try {
      const user = await this.authentikService.registerUser(registerDto);
      return {
        success: true,
        user: {
          id: user.pk,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('login')
  async initiateLogin(@Query('redirect_uri') redirectUri?: string) {
    try {
      const defaultRedirectUri = `${this.getBaseUrl()}/auth/callback`;
      const actualRedirectUri = redirectUri || defaultRedirectUri;
      
      const { authUrl, state } = this.authentikService.getAuthorizationUrl(actualRedirectUri);
      
      return {
        success: true,
        authUrl,
        state,
        redirectUri: actualRedirectUri,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('callback')
  async handleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('redirect_uri') redirectUri?: string
  ) {
    try {
      if (!code) {
        throw new Error('Authorization code not provided');
      }

      const defaultRedirectUri = `${this.getBaseUrl()}/auth/callback`;
      const actualRedirectUri = redirectUri || defaultRedirectUri;

      const tokens = await this.authentikService.exchangeCodeForTokens(code, actualRedirectUri);
      
      return {
        success: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
        idToken: tokens.id_token,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  private getBaseUrl(): string {
    // В продакшене это должно быть из конфигурации
    return 'http://localhost:8000';
  }

  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    try {
      const tokens = await this.authentikService.refreshToken(body.refreshToken);
      return {
        success: true,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  @Get('jwks')
  async getJWKS() {
    try {
      return await this.authentikService.getJWKS();
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
