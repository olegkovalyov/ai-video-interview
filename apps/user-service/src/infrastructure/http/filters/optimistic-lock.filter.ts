import { Catch, HttpStatus, Logger } from '@nestjs/common';
import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { OptimisticLockVersionMismatchError } from 'typeorm';

@Catch(OptimisticLockVersionMismatchError)
export class OptimisticLockFilter implements ExceptionFilter {
  private readonly logger = new Logger(OptimisticLockFilter.name);

  catch(_exception: OptimisticLockVersionMismatchError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.logger.warn(
      `Optimistic lock conflict [${request.method} ${request.url}]`,
    );

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message:
        'Resource was modified by another request. Please reload and try again.',
      error: 'Conflict',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
