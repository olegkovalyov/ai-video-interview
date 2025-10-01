import { DomainException } from '../../shared/exceptions/domain.exception';

/**
 * User-specific domain exceptions
 */

export class UserAlreadyExistsException extends DomainException {
  constructor(email: string) {
    super(`User with email ${email} already exists`);
    this.name = 'UserAlreadyExistsException';
  }
}

export class UserNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`User not found: ${identifier}`);
    this.name = 'UserNotFoundException';
  }
}

export class UserSuspendedException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is suspended`);
    this.name = 'UserSuspendedException';
  }
}

export class UserDeletedException extends DomainException {
  constructor(userId: string) {
    super(`User ${userId} is deleted`);
    this.name = 'UserDeletedException';
  }
}

export class InvalidUserOperationException extends DomainException {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUserOperationException';
  }
}
