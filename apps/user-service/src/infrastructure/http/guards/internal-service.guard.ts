import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Internal Service Guard
 * Protects internal endpoints from external access
 * Checks for internal service token in headers
 */
@Injectable()
export class InternalServiceGuard implements CanActivate {
  private readonly internalToken: string;

  constructor(private configService: ConfigService) {
    this.internalToken = this.configService.get('INTERNAL_SERVICE_TOKEN', 'internal-secret');
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-internal-token'];

    if (!token || token !== this.internalToken) {
      throw new UnauthorizedException('Invalid internal service token');
    }

    return true;
  }
}
