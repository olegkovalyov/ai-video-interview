import { DomainException } from './domain.exception';

/**
 * Generic access-denied domain exception.
 * Static `code` + `httpStatus` form the API contract — see DomainExceptionFilter.
 */

export class AccessDeniedException extends DomainException {
  static readonly code = 'ACCESS_DENIED';
  static readonly httpStatus = 403;

  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedException';
  }
}
