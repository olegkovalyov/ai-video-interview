import { Injectable, UnauthorizedException } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Protects internal endpoints from external access by verifying the
 * `x-internal-token` header against the configured shared secret.
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly internalToken: string;

  constructor(private readonly configService: ConfigService) {
    this.internalToken = this.configService.get<string>(
      'INTERNAL_SERVICE_TOKEN',
      'internal-secret',
    );
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const rawToken = request.headers['x-internal-token'];
    const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

    if (!token || token !== this.internalToken) {
      throw new UnauthorizedException('Invalid internal service token');
    }

    return true;
  }
}
