import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import { UserNotFoundException } from '../../../domain/exceptions/user.exceptions';
import { CompanyNotFoundException, CompanyAccessDeniedException } from '../../../domain/exceptions/company.exceptions';

/**
 * Domain Exception Filter
 * Catches domain-level exceptions and maps them to appropriate HTTP statuses.
 *
 * Mapping:
 * - *NotFoundException → 404 Not Found
 * - *AccessDeniedException → 403 Forbidden
 * - DomainException (default) → 400 Bad Request
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    const { status, error } = this.mapExceptionToHttp(exception);

    this.logger.warn(
      `Domain exception [${exception.name}]: ${exception.message} [${request.method} ${request.url}]`,
    );

    response.status(status).json({
      statusCode: status,
      message: exception.message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapExceptionToHttp(exception: DomainException): { status: number; error: string } {
    if (exception instanceof UserNotFoundException || exception instanceof CompanyNotFoundException) {
      return { status: HttpStatus.NOT_FOUND, error: 'Not Found' };
    }

    if (exception instanceof CompanyAccessDeniedException) {
      return { status: HttpStatus.FORBIDDEN, error: 'Forbidden' };
    }

    return { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' };
  }
}
