import { Controller, Post, Body, Get, Query, Res, Req } from '@nestjs/common';
import { AuthentikService } from './authentik.service';
import { Response } from 'express';
import { Request } from 'express';
import { OidcService } from './oidc.service';


@Controller('auth')
export class AuthController {
  constructor(
    private readonly authentikService: AuthentikService,
    private readonly oidcService: OidcService,
  ) {}


  @Post('logout')
  async logout(
    @Body() body: { accessToken?: string; refreshToken?: string },
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const isSecure = false; // enable true in prod behind TLS
    const cookies = req.headers['cookie'] || '';

    const fromCookies = (name: string): string | undefined => {
      const parts = cookies.split(';');
      for (const p of parts) {
        const [k, ...rest] = p.split('=');
        if (!k || rest.length === 0) continue;
        if (k.trim() === name) {
          const v = rest.join('=').trim();
          try { return decodeURIComponent(v); } catch { return v; }
        }
      }
      return undefined;
    };

    const accessToken = body?.accessToken || fromCookies('access_token');
    const refreshToken = body?.refreshToken || fromCookies('refresh_token');

    // Try to revoke tokens if available
    try {
      if (refreshToken) {
        await this.oidcService.revokeToken(refreshToken, 'refresh_token');
      }
    } catch (e) {
      // ignore revocation errors
    }
    try {
      if (accessToken) {
        await this.oidcService.revokeToken(accessToken, 'access_token');
      }
    } catch (e) {
      // ignore revocation errors
    }

    // Clear cookies
    res.cookie('access_token', '', { httpOnly: true, sameSite: 'lax', secure: isSecure, path: '/', maxAge: 0 });
    res.cookie('refresh_token', '', { httpOnly: true, sameSite: 'lax', secure: isSecure, path: '/', maxAge: 0 });

    // Optionally return end_session_endpoint for front-end redirect
    let endSession: string | undefined;
    try {
      const disc = await this.oidcService.getDiscovery();
      endSession = disc.end_session_endpoint;
    } catch {}

    return res.json({ success: true, endSessionEndpoint: endSession });
  }

  @Get('login')
  async initiateLogin(@Query('redirect_uri') redirectUri?: string) {
    try {
      // Always use frontend callback URL, not API gateway URL
      const frontendOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';
      const defaultRedirectUri = `${frontendOrigin}/auth/callback`;
      const actualRedirectUri = redirectUri || defaultRedirectUri;
      
      console.log('🔧 Using redirect_uri:', actualRedirectUri);
      
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
    @Query('redirect_uri') redirectUri?: string,
    @Res() res?: Response
  ) {
    try {
      if (!code) {
        throw new Error('Authorization code not provided');
      }

      // Use the same frontend callback URL as in login
      const frontendOrigin = process.env.NEXT_PUBLIC_WEB_ORIGIN || 'http://localhost:3000';
      const defaultRedirectUri = `${frontendOrigin}/auth/callback`;
      const actualRedirectUri = redirectUri || defaultRedirectUri;
      
      console.log('🔧 Callback using redirect_uri:', actualRedirectUri);

      const tokens = await this.authentikService.exchangeCodeForTokens(code, actualRedirectUri);

      // Set httpOnly cookies
      const isSecure = false; // set true behind HTTPS/proxy in prod
      const accessTtlMs = (tokens.expires_in ?? 300) * 1000;
      const refreshTtlMs = 30 * 24 * 60 * 60 * 1000; // 30d default

      res?.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
        maxAge: accessTtlMs,
      });
      if (tokens.refresh_token) {
        res?.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isSecure,
          path: '/',
          maxAge: refreshTtlMs,
        });
      }

      return res?.json({
        success: true,
        expiresIn: tokens.expires_in,
        tokenType: tokens.token_type,
        // idToken intentionally not returned; tokens are in cookies
      });
    } catch (error) {
      return res?.status(400).json({
        success: false,
        error: error.message,
      });
    }
  }

  private getBaseUrl(): string {
    // В продакшене это должно быть из конфигурации
    return 'http://localhost:8000';
  }

  @Post('refresh')
  async refresh(
    @Body() body: { refreshToken?: string } | undefined,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    try {
      let refreshToken = body?.refreshToken;
      if (!refreshToken) {
        const cookies = req.headers['cookie'] || '';
        const parts = cookies.split(';');
        for (const p of parts) {
          const [k, ...rest] = p.split('=');
          if (!k || rest.length === 0) continue;
          if (k.trim() === 'refresh_token') {
            const v = rest.join('=').trim();
            try { refreshToken = decodeURIComponent(v); } catch { refreshToken = v; }
            break;
          }
        }
      }
      if (!refreshToken) {
        return res.status(400).json({ success: false, error: 'Missing refresh token' });
      }

      const tokens = await this.authentikService.refreshToken(refreshToken);

      const isSecure = false; // set true behind HTTPS/proxy in prod
      const accessTtlMs = (tokens.expires_in ?? 300) * 1000;
      const refreshTtlMs = 30 * 24 * 60 * 60 * 1000; // 30d default

      res.cookie('access_token', tokens.access_token, {
        httpOnly: true,
        sameSite: 'lax',
        secure: isSecure,
        path: '/',
        maxAge: accessTtlMs,
      });
      if (tokens.refresh_token) {
        res.cookie('refresh_token', tokens.refresh_token, {
          httpOnly: true,
          sameSite: 'lax',
          secure: isSecure,
          path: '/',
          maxAge: refreshTtlMs,
        });
      }

      return res.json({ success: true, expiresIn: tokens.expires_in });
    } catch (error) {
      return res.status(400).json({ success: false, error: error.message });
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
