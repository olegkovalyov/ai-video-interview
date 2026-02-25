import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Response } from 'express';
import {
  DomainException,
  TemplateNotFoundException,
  QuestionNotFoundException,
  TemplateUnauthorizedException,
  TemplateAlreadyPublishedException,
  DuplicateQuestionOrderException,
  InvalidTemplateStateException,
  TemplateArchivedException,
} from '../../../domain/exceptions/interview-template.exceptions';
import {
  InvitationNotFoundException,
  InvitationAccessDeniedException,
  InvitationExpiredException,
  DuplicateInvitationException,
  DuplicateResponseException,
  InvalidInvitationStateException,
  InvitationIncompleteException,
} from '../../../domain/exceptions/invitation.exceptions';
import { LoggerService } from '../../logger/logger.service';

/**
 * Domain Exception Filter
 * Catches domain-level exceptions and maps them to appropriate HTTP statuses.
 *
 * Mapping:
 * - *NotFoundException -> 404 Not Found
 * - *AccessDeniedException, *UnauthorizedException -> 403 Forbidden
 * - *DuplicateException, *AlreadyPublished -> 409 Conflict
 * - *InvalidStateException, *Archived, *Incomplete -> 422 Unprocessable Entity
 * - *ExpiredException -> 410 Gone
 * - DomainException (default) -> 400 Bad Request
 */
@Injectable()
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

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
      exception instanceof TemplateNotFoundException ||
      exception instanceof QuestionNotFoundException ||
      exception instanceof InvitationNotFoundException
    ) {
      return { status: HttpStatus.NOT_FOUND, error: 'Not Found' };
    }

    // 403 Forbidden
    if (
      exception instanceof TemplateUnauthorizedException ||
      exception instanceof InvitationAccessDeniedException
    ) {
      return { status: HttpStatus.FORBIDDEN, error: 'Forbidden' };
    }

    // 409 Conflict
    if (
      exception instanceof DuplicateInvitationException ||
      exception instanceof DuplicateResponseException ||
      exception instanceof DuplicateQuestionOrderException ||
      exception instanceof TemplateAlreadyPublishedException
    ) {
      return { status: HttpStatus.CONFLICT, error: 'Conflict' };
    }

    // 422 Unprocessable Entity
    if (
      exception instanceof InvalidInvitationStateException ||
      exception instanceof InvalidTemplateStateException ||
      exception instanceof TemplateArchivedException ||
      exception instanceof InvitationIncompleteException
    ) {
      return { status: HttpStatus.UNPROCESSABLE_ENTITY, error: 'Unprocessable Entity' };
    }

    // 410 Gone
    if (exception instanceof InvitationExpiredException) {
      return { status: HttpStatus.GONE, error: 'Gone' };
    }

    // 400 Bad Request (default for all other domain exceptions)
    return { status: HttpStatus.BAD_REQUEST, error: 'Bad Request' };
  }
}
