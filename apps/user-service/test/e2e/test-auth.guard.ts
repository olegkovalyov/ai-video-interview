import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

/**
 * Test Internal Service Guard for E2E tests
 * Validates X-Internal-Token header and ensures user context headers exist
 */
@Injectable()
export class TestInternalServiceGuard implements CanActivate {
  private readonly testInternalToken = 'test-internal-token';
  // Valid UUID for test user (must be UUID format for database)
  private readonly defaultTestUserId = '00000000-0000-0000-0000-000000000001';

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-internal-token'];

    // In E2E tests, allow requests without token for simplicity
    // or validate if token is provided
    if (token && token !== this.testInternalToken) {
      throw new UnauthorizedException('Invalid internal token');
    }

    // Ensure headers exist - set defaults if not provided
    // This allows tests without explicit headers to work
    if (!request.headers['x-user-id']) {
      request.headers['x-user-id'] = this.defaultTestUserId;
    }
    if (!request.headers['x-user-role']) {
      request.headers['x-user-role'] = 'admin';
    }

    return true;
  }
}
