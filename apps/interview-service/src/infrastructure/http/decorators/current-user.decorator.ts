import { createParamDecorator, ExecutionContext, Logger } from '@nestjs/common';

const logger = new Logger('CurrentUserDecorator');

/**
 * Current User Decorator
 * Extracts user ID from JWT payload in request
 * 
 * ВАЖНО: Сначала пытается взять userId (наш внутренний ID),
 * затем sub (для обратной совместимости со старыми токенами)
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    
    const userId = request.user?.userId;
    const sub = request.user?.sub;
    const email = request.user?.email;
    
    logger.log(`🎯 [User Service] CurrentUser decorator - userId=${userId}, sub=${sub}, email=${email}`);
    
    // ИСПРАВЛЕНО: userId должен быть первым, а не sub!
    // sub содержит keycloakId (externalAuthId), а не наш внутренний userId
    const result = request.user?.userId || request.user?.sub;
    
    logger.log(`🎯 [User Service] CurrentUser returning: ${result}`);
    
    return result;
  },
);
