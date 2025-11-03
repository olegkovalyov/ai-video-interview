import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

/**
 * RolesGuard
 * Проверяет наличие требуемых ролей в JWT токене пользователя
 * 
 * Использование:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles('admin')
 * async adminOnlyEndpoint() {}
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Получаем требуемые роли из metadata декоратора @Roles()
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Если роли не указаны, разрешаем доступ
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Получаем пользователя из request (добавляется JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Получаем роли пользователя из JWT (realm_access.roles)
    const userRoles: string[] = user.realm_access?.roles || [];

    // Проверяем наличие хотя бы одной требуемой роли
    const hasRole = requiredRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException(
        `Required roles: ${requiredRoles.join(', ')}. User roles: ${userRoles.join(', ')}`
      );
    }

    return true;
  }
}
