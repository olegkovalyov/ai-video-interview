import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from "@nestjs/common";

/**
 * Test Internal Service Guard for E2E tests
 * Always allows requests through (bypasses x-internal-token check).
 * Sets default user context headers if not provided.
 */
@Injectable()
export class TestInternalServiceGuard implements CanActivate {
  private readonly defaultTestUserId = "00000000-0000-0000-0000-000000000001";

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    // Set defaults if not provided so handlers always have context
    if (!request.headers["x-user-id"]) {
      request.headers["x-user-id"] = this.defaultTestUserId;
    }
    if (!request.headers["x-user-role"]) {
      request.headers["x-user-role"] = "admin";
    }

    return true;
  }
}
