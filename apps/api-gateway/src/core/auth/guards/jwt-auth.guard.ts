import { CanActivate, ExecutionContext, Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { OidcService } from '../services/oidc.service';
import { RegistrationSaga } from '../sagas/registration.saga';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { extractBearerToken, extractTokenFromCookies } from '../utils/token-extractor';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);
  
  constructor(
    private readonly oidc: OidcService,
    private readonly registrationSaga: RegistrationSaga,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if endpoint is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (isPublic) {
      this.logger.debug('JWT Guard: Public endpoint, skipping authentication');
      return true;
    }

    const req = context.switchToHttp().getRequest<Request & { user?: any }>();

    // Internal service-to-service bypass (for system tests and internal calls)
    const internalToken = req.headers['x-internal-token'] as string;
    if (internalToken && internalToken === process.env.INTERNAL_SERVICE_TOKEN) {
      req.user = {
        sub: req.headers['x-user-id'] || 'system',
        realm_access: { roles: [req.headers['x-user-role'] || 'admin'] },
        email: 'system@internal',
        companyId: req.headers['x-company-id'] || undefined,
      };
      return true;
    }

    const requestInfo = {
      url: req.url,
      method: req.method,
      hasAuthHeader: !!req.headers['authorization'],
      hasCookieHeader: !!req.headers['cookie']
    };
    this.logger.debug(`JWT Guard: Processing request - ${JSON.stringify(requestInfo)}`);

    const auth = req.headers['authorization'] || '';
    let token = extractBearerToken(auth);
    if (!token) {
      token = extractTokenFromCookies(req.headers['cookie'] || '');
    }

    const extractionResult = {
      tokenFromBearer: !!extractBearerToken(auth),
      tokenFromCookies: !!extractTokenFromCookies(req.headers['cookie'] || ''),
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
      
      // КРИТИЧНО: Добавляем userId в request.user
      // JWT payload содержит только sub (keycloakId), но нам нужен внутренний userId
      try {
        const keycloakId = payload.sub as string;
        const email = (payload.email || '') as string;
        const firstName = payload.given_name as string | undefined;
        const lastName = payload.family_name as string | undefined;
        
        if (!keycloakId) {
          throw new Error('Missing sub (keycloakId) in JWT payload');
        }
        
        const userResult = await this.registrationSaga.ensureUserExists({
          keycloakId,
          email,
          firstName,
          lastName,
        });
        
        req.user = {
          ...payload,
          userId: userResult.userId, // Добавляем внутренний userId
        };
        
        this.logger.log(`🔐 JWT Guard: Token verified - keycloakId=${keycloakId}, userId=${userResult.userId}`);
      } catch (error) {
        this.logger.error(`JWT Guard: Failed to get userId for ${payload.sub}:`, error);
        req.user = payload; // Fallback to just payload
      }
      
      return true;
    } catch (e: any) {
      this.logger.error(`JWT Guard: Token verification failed - ${e?.message}`);
      throw new UnauthorizedException(e?.message || 'Invalid token');
    }
  }

}
