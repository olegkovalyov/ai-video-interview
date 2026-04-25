import { Catch, Logger } from '@nestjs/common';
import type { ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { DomainException } from '../../../domain/exceptions/domain.exception';

/**
 * Domain Exception Filter
 *
 * Single source of truth for translating domain exceptions into HTTP responses.
 * Each DomainException subclass declares its own static `code` and `httpStatus`
 * (see exceptions/*.ts) — this filter just reads those static fields off the
 * exception's constructor. No `instanceof` chain, no mapping table here.
 *
 * Response contract (consumed by frontend i18n layer):
 * - `success: false`            — uniform success/failure flag across the API
 * - `code: string`              — stable machine-readable identifier
 *                                 (e.g. 'USER_NOT_FOUND'); frontend looks up
 *                                 the localized user-facing message by code
 * - `error: string`             — raw exception message for logs/dev tools
 * - `timestamp`, `path`         — debug aids, not part of the API contract
 */
@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter<DomainException> {
  private readonly logger = new Logger(DomainExceptionFilter.name);

  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Reading via `exception.constructor` walks the prototype chain, so a
    // subclass that forgets to override falls back to DomainException defaults.
    const ctor = exception.constructor as typeof DomainException;
    const code = ctor.code;
    const status = ctor.httpStatus;

    this.logger.warn(
      `Domain exception [${exception.name}] code=${code}: ${exception.message} [${request.method} ${request.url}]`,
    );

    response.status(status).json({
      success: false,
      code,
      error: exception.message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
