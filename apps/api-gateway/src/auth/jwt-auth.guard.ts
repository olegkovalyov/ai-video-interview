import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { OidcService } from './oidc.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly oidc: OidcService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { user?: any }>();

    const auth = req.headers['authorization'] || '';
    const token = this.extractBearer(auth);
    if (!token) {
      throw new UnauthorizedException('Missing Authorization: Bearer <token>');
    }

    try {
      const { payload } = await this.oidc.verifyAccessToken(token);
      req.user = payload;
      return true;
    } catch (e: any) {
      throw new UnauthorizedException(e?.message || 'Invalid token');
    }
  }

  private extractBearer(header: string): string | null {
    if (!header) return null;
    const [type, value] = header.split(' ');
    if (!type || type.toLowerCase() !== 'bearer' || !value) return null;
    return value;
  }
}
