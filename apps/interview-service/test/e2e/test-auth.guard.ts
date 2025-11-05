import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Simplified Auth Guard for E2E tests
 * Decodes JWT without JWKS validation
 */
@Injectable()
export class TestAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header');
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Decode without verification (for tests)
      const payload = this.jwtService.decode(token) as any;
      
      if (!payload) {
        throw new UnauthorizedException('Invalid token');
      }

      // Attach user to request
      request.user = {
        userId: payload.userId,
        role: payload.role,
        roles: [payload.role], // RolesGuard expects roles array
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Token decode failed');
    }
  }
}
