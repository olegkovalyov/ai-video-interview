import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { OidcService } from '../services/oidc.service';
import { CookieService } from '../services/cookie.service';
import { TokenService } from '../services/token.service';
import { extractBearerToken, extractTokenFromCookies } from '../utils/token-extractor';

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

    const requestInfo = {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers['authorization'],
      hasCookieHeader: !!req.headers['cookie']
    };
    this.logger.debug(`JWT Refresh Guard: Processing request - ${JSON.stringify(requestInfo)}`);

    // 1. Пытаемся получить access token
    const auth = req.headers['authorization'] || '';
    let token = extractBearerToken(auth);
    if (!token) {
      token = extractTokenFromCookies(req.headers['cookie'] || '');
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
      this.logger.debug(`JWT Refresh Guard: Access token verification failed - ${tokenError?.message}`);

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

      this.logger.debug(`JWT Refresh Guard: Found refresh token (length: ${refreshToken.length})`);

      // Пытаемся обновить токены
      const { tokens } = await this.tokenService.refreshTokens(refreshToken);
      
      this.logger.debug('JWT Refresh Guard: Tokens refreshed successfully');

      // Устанавливаем новые cookies
      this.cookieService.setAuthTokensCookies(res, tokens);

      // Верифицируем новый access token и устанавливаем user
      const { payload } = await this.oidc.verifyAccessToken(tokens.access_token);
      req.user = payload;

      this.logger.debug(`JWT Refresh Guard: Auto-refresh completed successfully (user: ${payload?.sub})`);

      return true;
    } catch (refreshError: any) {
      const errorDetails = JSON.stringify({
        refreshError: refreshError?.message,
        originalError: originalError?.message,
        isTokenInactive: refreshError?.message?.includes('Token is not active') || refreshError?.message?.includes('invalid_grant')
      });
      this.logger.error(`JWT Refresh Guard: Auto-refresh failed - ${errorDetails}`);

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

}
