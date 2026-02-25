import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class AuthErrorInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthErrorInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        const request = context.switchToHttp().getRequest();
        const response = context.switchToHttp().getResponse();
        
        // Логируем ошибку с контекстом
        this.logger.error(`Auth error in ${request.method} ${request.url}:`, {
          error: error.message,
          stack: error.stack,
          userId: request.user?.sub,
          userAgent: request.headers['user-agent'],
        });

        // Определяем HTTP статус и сообщение на основе типа ошибки
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errorCode = 'INTERNAL_ERROR';

        if (error instanceof HttpException) {
          status = error.getStatus();
          const response = error.getResponse();
          // Extract message from HttpException response (can be string or object)
          if (typeof response === 'string') {
            message = response;
          } else if (typeof response === 'object' && response !== null) {
            message = (response as any).error || (response as any).message || error.message;
          } else {
            message = error.message;
          }
        } else if (error.message) {
          // Обрабатываем специфичные auth ошибки
          const errorMessage = error.message.toLowerCase();

          if (errorMessage.includes('authorization code')) {
            status = HttpStatus.BAD_REQUEST;
            message = 'Invalid or missing authorization code';
            errorCode = 'INVALID_AUTH_CODE';
          } else if (errorMessage.includes('refresh token') || errorMessage.includes('missing refresh token')) {
            status = HttpStatus.UNAUTHORIZED;
            message = 'Invalid or missing refresh token';
            errorCode = 'INVALID_REFRESH_TOKEN';
          } else if (errorMessage.includes('access token')) {
            status = HttpStatus.UNAUTHORIZED;
            message = 'Invalid or expired access token';
            errorCode = 'INVALID_ACCESS_TOKEN';
          } else if (errorMessage.includes('keycloak') || errorMessage.includes('oidc')) {
            status = HttpStatus.BAD_GATEWAY;
            message = 'Authentication service unavailable';
            errorCode = 'AUTH_SERVICE_ERROR';
          } else if (errorMessage.includes('user not found') || errorMessage.includes('invalid user')) {
            status = HttpStatus.NOT_FOUND;
            message = 'User not found';
            errorCode = 'USER_NOT_FOUND';
          } else if (errorMessage.includes('token expired')) {
            status = HttpStatus.UNAUTHORIZED;
            message = 'Token has expired';
            errorCode = 'TOKEN_EXPIRED';
          } else {
            status = HttpStatus.BAD_REQUEST;
            message = 'Authentication error';
            errorCode = 'AUTH_ERROR';
          }
        }

        // Создаем стандартизированный ответ об ошибке
        const errorResponse = {
          success: false,
          error: message,
          code: errorCode,
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        // В production не возвращаем stack trace
        if (process.env.NODE_ENV !== 'production' && error.stack) {
          errorResponse['stack'] = error.stack;
        }

        // Для некоторых auth ошибок возвращаем дополнительную информацию
        if (errorCode === 'INVALID_REFRESH_TOKEN' || errorCode === 'TOKEN_EXPIRED') {
          errorResponse['shouldRedirectToLogin'] = true;
        }

        return throwError(() => new HttpException(errorResponse, status));
      }),
    );
  }
}
