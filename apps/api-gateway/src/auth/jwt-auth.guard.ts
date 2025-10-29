import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Request } from 'express';
import { OidcService } from './oidc.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  
  constructor(private readonly oidc: OidcService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();

    const requestInfo = {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers['authorization'],
      hasCookieHeader: !!req.headers['cookie']
    };
    this.logger.debug(`JWT Guard: Processing request - ${JSON.stringify(requestInfo)}`);

    const auth = req.headers['authorization'] || '';
    let token = this.extractBearer(auth);
    if (!token) {
      token = this.extractFromCookies(req.headers['cookie'] || '');
    }
    
    const extractionResult = {
      tokenFromBearer: !!this.extractBearer(auth),
      tokenFromCookies: !!this.extractFromCookies(req.headers['cookie'] || ''),
      hasToken: !!token
    };
    this.logger.debug(`JWT Guard: Token extraction result - ${JSON.stringify(extractionResult)}`);
    
    if (!token) {
      this.logger.warn('JWT Guard: No access token found');
      throw new UnauthorizedException('Missing access token');
    }

    try {
      this.logger.debug('JWT Guard: Attempting token verification...');
      const { payload } = await this.oidc.verifyAccessToken(token);
      req.user = payload;
      this.logger.debug(`JWT Guard: Token verified successfully (user: ${payload?.sub})`);
      return true;
    } catch (e: any) {
      this.logger.error(`JWT Guard: Token verification failed - ${e?.message}`);
      throw new UnauthorizedException(e?.message || 'Invalid token');
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
