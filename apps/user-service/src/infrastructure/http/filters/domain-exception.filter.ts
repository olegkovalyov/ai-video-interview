import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * Domain Exception Filter
 * Catches domain-level exceptions and returns 400 Bad Request
 * 
 * Domain exceptions represent business rule violations and should be
 * communicated to the client as validation errors, not server errors.
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const status = HttpStatus.BAD_REQUEST;

    // Log domain exception for debugging
    this.logger.warn(
      `Domain validation error: ${exception.message} [${request.method} ${request.url}]`,
    );

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error: 'Bad Request',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
