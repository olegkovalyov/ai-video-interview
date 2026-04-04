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
import {
  CompanyNotFoundException,
  CompanyAccessDeniedException,
} from '../../../domain/exceptions/company.exceptions';
import {
  SkillNotFoundException,
  SkillAlreadyExistsException,
  SkillCategoryNotFoundException,
  SkillNotActiveException,
} from '../../../domain/exceptions/skill.exceptions';
import {
  CandidateProfileNotFoundException,
  CandidateSkillAlreadyExistsException,
} from '../../../domain/exceptions/candidate.exceptions';
import { AccessDeniedException } from '../../../domain/exceptions/access-denied.exception';

/**
 * Domain Exception Filter
 * Catches domain-level exceptions and maps them to appropriate HTTP statuses.
 *
 * Mapping:
 * - *NotFoundException → 404 Not Found
 * - *AccessDenied*, UserSuspended → 403 Forbidden
 * - *AlreadyExists* → 409 Conflict
 * - UserDeleted → 410 Gone
 * - InvalidUserOperation, SkillNotActive, SkillCategoryNotFound → 422 Unprocessable Entity
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

  private mapExceptionToHttp(exception: DomainException): {
    status: number;
    error: string;
  } {
    // 404 Not Found
    if (
      exception instanceof UserNotFoundException ||
      exception instanceof CompanyNotFoundException ||
      exception instanceof SkillNotFoundException ||
      exception instanceof CandidateProfileNotFoundException
    ) {
      return { status: HttpStatus.NOT_FOUND, error: 'Not Found' };
    }

    // 403 Forbidden
    if (
      exception instanceof AccessDeniedException ||
      exception instanceof CompanyAccessDeniedException ||
      exception instanceof UserSuspendedException
    ) {
      return { status: HttpStatus.FORBIDDEN, error: 'Forbidden' };
    }

    // 409 Conflict
    if (
      exception instanceof UserAlreadyExistsException ||
      exception instanceof SkillAlreadyExistsException ||
      exception instanceof CandidateSkillAlreadyExistsException
    ) {
      return { status: HttpStatus.CONFLICT, error: 'Conflict' };
    }

    // 410 Gone
    if (exception instanceof UserDeletedException) {
      return { status: HttpStatus.GONE, error: 'Gone' };
    }

    // 422 Unprocessable Entity
    if (
      exception instanceof InvalidUserOperationException ||
      exception instanceof SkillNotActiveException ||
      exception instanceof SkillCategoryNotFoundException
    ) {
      return {
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        error: 'Unprocessable Entity',
      };
    }

    // 400 Bad Request (default for any DomainException)
    return { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' };
  }
}
