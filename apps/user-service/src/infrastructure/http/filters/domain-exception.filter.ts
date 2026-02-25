import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../../../domain/exceptions/domain.exception';
import {
  UserNotFoundException,
  UserAlreadyExistsException,
  UserSuspendedException,
  UserDeletedException,
  InvalidUserOperationException,
} from '../../../domain/exceptions/user.exceptions';
import { CompanyNotFoundException, CompanyAccessDeniedException } from '../../../domain/exceptions/company.exceptions';

/**
 * Domain Exception Filter
 * Catches domain-level exceptions and maps them to appropriate HTTP statuses.
 *
 * Mapping:
 * - UserNotFoundException, CompanyNotFoundException → 404 Not Found
 * - CompanyAccessDeniedException, UserSuspendedException → 403 Forbidden
 * - UserAlreadyExistsException → 409 Conflict
 * - UserDeletedException → 410 Gone
 * - InvalidUserOperationException → 422 Unprocessable Entity
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

    if (exception instanceof CompanyAccessDeniedException || exception instanceof UserSuspendedException) {
      return { status: HttpStatus.FORBIDDEN, error: 'Forbidden' };
    }

    if (exception instanceof UserAlreadyExistsException) {
      return { status: HttpStatus.CONFLICT, error: 'Conflict' };
    }

    if (exception instanceof UserDeletedException) {
      return { status: HttpStatus.GONE, error: 'Gone' };
    }

    if (exception instanceof InvalidUserOperationException) {
      return { status: HttpStatus.UNPROCESSABLE_ENTITY, error: 'Unprocessable Entity' };
    }

    return { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' };
  }
}
