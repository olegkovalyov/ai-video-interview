/* eslint-disable max-classes-per-file --
 * Domain exception bundle: all exceptions for the User bounded context
 * grouped by topic (Vaughn Vernon "Implementing DDD" style). Splitting
 * each into its own file fragments coherent domain knowledge with no benefit.
 */
import { DomainException } from './domain.exception';

/**
 * User-specific domain exceptions.
 * Static `code` + `httpStatus` form the API contract — see DomainExceptionFilter.
 * httpStatus is a raw HTTP code (RFC 7231) — domain stays framework-free.
 */

export class UserAlreadyExistsException extends DomainException {
  static readonly code = 'USER_ALREADY_EXISTS';
  static readonly httpStatus = 409;

  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsException';
  }
}

export class UserNotFoundException extends DomainException {
  static readonly code = 'USER_NOT_FOUND';
  static readonly httpStatus = 404;

  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundException';
  }
}

export class UserSuspendedException extends DomainException {
  static readonly code = 'USER_SUSPENDED';
  static readonly httpStatus = 403;

  constructor(userId: string) {
    super(`User ${userId} is suspended`);
    this.name = 'UserSuspendedException';
  }
}

export class UserDeletedException extends DomainException {
  static readonly code = 'USER_DELETED';
  static readonly httpStatus = 410;

  constructor(userId: string) {
    super(`User ${userId} is deleted`);
    this.name = 'UserDeletedException';
  }
}

export class InvalidUserOperationException extends DomainException {
  static readonly code = 'INVALID_USER_OPERATION';
  static readonly httpStatus = 422;

  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserOperationException';
  }
}
