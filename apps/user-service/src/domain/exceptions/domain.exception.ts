/**
 * Base exception for domain-level errors.
 * Subclasses MUST override `code` and `httpStatus` static fields —
 * these form the contract consumed by DomainExceptionFilter.
 *
 * `code` is the stable machine-readable identifier the frontend uses
 * to look up a localized user-facing message; never rename without
 * versioning the API.
 */
export class DomainException extends Error {
  static readonly code: string = 'DOMAIN_ERROR';
  static readonly httpStatus: number = 400;

  constructor(message: string) {
    super(message);
    this.name = 'DomainException';
    Error.captureStackTrace(this, this.constructor);
  }
}
