import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import * as jose from 'jose';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { LoggerService } from '../../logger/logger.service';

/**
 * JWT Auth Guard for Interview Service
 * Validates JWT token and populates request.user
 * Skips validation for @Public() endpoints
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private jwksGetter: ReturnType<typeof jose.createRemoteJWKSet> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request & { user?: any }>();

    // Extract token from Authorization header or cookies
    const token = this.extractToken(request);

    if (!token) {
      this.logger.warn('JWT Guard: No access token found');
      throw new UnauthorizedException('Missing access token');
    }

    try {
      // Get JWKS getter from Keycloak
      if (!this.jwksGetter) {
        const issuer = this.configService.get<string>('KEYCLOAK_ISSUER_URL') || 
                      'http://localhost:8090/realms/ai-video-interview';
        const jwksUrl = `${issuer}/protocol/openid-connect/certs`;
        
        this.logger.debug(`Setting up JWKS from: ${jwksUrl}`);
        this.jwksGetter = jose.createRemoteJWKSet(new URL(jwksUrl));
      }

      // Verify token
      const { payload } = await jose.jwtVerify(token, this.jwksGetter, {
        issuer: this.configService.get<string>('KEYCLOAK_ISSUER_URL') || 
                'http://localhost:8090/realms/ai-video-interview',
        audience: 'ai-video-interview-app',
      });

      // Populate request.user with JWT payload
      request.user = payload;

      this.logger.debug(`JWT verified`, { userId: payload.sub as string, action: 'jwt_verify' });

      return true;
    } catch (error: any) {
      this.logger.error(`JWT Guard: Token verification failed - ${error?.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private extractToken(request: Request): string | null {
    // Try Authorization header first
    const authHeader = request.headers['authorization'];
    if (authHeader) {
      const [type, token] = authHeader.split(' ');
      if (type?.toLowerCase() === 'bearer' && token) {
        return token;
      }
    }

    // Try cookies as fallback
    const cookieHeader = request.headers['cookie'];
    if (cookieHeader) {
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
    }

    return null;
  }
}
