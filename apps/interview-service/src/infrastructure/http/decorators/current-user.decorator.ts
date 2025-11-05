import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

const logger = new Logger('CurrentUserDecorator');

/**
 * Current User Decorator
 * Extracts user object from JWT payload in request
 * Returns full user object with userId, role, etc.
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    const user = request.user;
    
    logger.log(`🎯 CurrentUser decorator - userId=${user?.userId}, role=${user?.role}`);
    
    return user;
  },
);
