import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcService } from './oidc.service';
import { CookieService } from './cookie.service';
import { TokenService } from './token.service';

@Injectable()
export class JwtRefreshGuard implements CanActivate {
  private readonly logger = new Logger(JwtRefreshGuard.name);
  
  constructor(
    private readonly oidc: OidcService,
    private readonly cookieService: CookieService,
    private readonly tokenService: TokenService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();
    const res = context.switchToHttp().getResponse<Response>();

    this.logger.debug('JWT Refresh Guard: Processing request', {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers['authorization'],
      hasCookieHeader: !!req.headers['cookie']
    });

    // 1. Пытаемся получить access token
    const auth = req.headers['authorization'] || '';
    let token = this.extractBearer(auth);
    if (!token) {
      token = this.extractFromCookies(req.headers['cookie'] || '');
    }

    if (!token) {
      this.logger.warn('JWT Refresh Guard: No access token found');
      throw new UnauthorizedException('Missing access token');
    }

    // 2. Пытаемся верифицировать access token
    try {
      this.logger.debug('JWT Refresh Guard: Attempting token verification...');
      const { payload } = await this.oidc.verifyAccessToken(token);
      req.user = payload;
      this.logger.debug('JWT Refresh Guard: Token verified successfully');
      return true;
    } catch (tokenError: any) {
      this.logger.debug('JWT Refresh Guard: Access token verification failed', {
        error: tokenError?.message
      });

      // 3. Если access token невалиден, пытаемся refresh
      return await this.attemptTokenRefresh(req, res, tokenError);
    }
  }

  private async attemptTokenRefresh(req: Request & { user?: any }, res: Response, originalError: any): Promise<boolean> {
    try {
      this.logger.debug('JWT Refresh Guard: Attempting automatic token refresh...');

      // Получаем refresh token из cookies
      const refreshToken = this.cookieService.parseCookie(req, 'refresh_token');
      if (!refreshToken) {
        this.logger.warn('JWT Refresh Guard: No refresh token available for auto-refresh');
        throw new UnauthorizedException('No refresh token available');
      }

      this.logger.debug('JWT Refresh Guard: Found refresh token', {
        refreshTokenLength: refreshToken.length,
        refreshTokenPreview: refreshToken.substring(0, 50) + '...'
      });

      // Пытаемся обновить токены
      const { tokens } = await this.tokenService.refreshTokens(refreshToken);
      
      this.logger.debug('JWT Refresh Guard: Tokens refreshed successfully');

      // Устанавливаем новые cookies
      this.cookieService.setAuthTokensCookies(res, tokens);

      // Верифицируем новый access token и устанавливаем user
      const { payload } = await this.oidc.verifyAccessToken(tokens.access_token);
      req.user = payload;

      this.logger.debug('JWT Refresh Guard: Auto-refresh completed successfully', {
        sub: payload?.sub
      });

      return true;
    } catch (refreshError: any) {
      this.logger.error('JWT Refresh Guard: Auto-refresh failed', {
        refreshError: refreshError?.message,
        originalError: originalError?.message,
        isTokenInactive: refreshError?.message?.includes('Token is not active') || refreshError?.message?.includes('invalid_grant')
      });

      // Если refresh token недействителен, очищаем cookies
      if (refreshError?.message?.includes('Token is not active') || 
          refreshError?.message?.includes('invalid_grant') ||
          refreshError?.message?.includes('Token refresh failed: 400')) {
        
        this.logger.debug('JWT Refresh Guard: Clearing invalid cookies due to inactive refresh token');
        this.cookieService.clearAuthCookies(res);
      }

      // Возвращаем ошибку которая приведет к редиректу на login
      throw new UnauthorizedException('Session expired - please login again');
    }
  }

  private extractBearer(header: string): string | null {
    if (!header) return null;
    const [type, value] = header.split(' ');
    if (!type || type.toLowerCase() !== 'bearer' || !value) return null;
    return value;
  }

  private extractFromCookies(cookieHeader: string): string | null {
    if (!cookieHeader) return null;
    const pairs = cookieHeader.split(';');
    for (const p of pairs) {
      const [rawKey, ...rest] = p.split('=');
      if (!rawKey || rest.length === 0) continue;
      const key = rawKey.trim();
      if (key !== 'access_token') continue;
      const value = rest.join('=').trim();
      try {
        return decodeURIComponent(value);
      } catch {
        return value;
      }
    }
    return null;
  }
}
