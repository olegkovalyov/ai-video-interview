import { DomainException } from './domain.exception';

/**
 * Company-specific domain exceptions.
 * Static `code` + `httpStatus` form the API contract — see DomainExceptionFilter.
 */

export class CompanyNotFoundException extends DomainException {
  static readonly code = 'COMPANY_NOT_FOUND';
  static readonly httpStatus = 404;

  constructor(companyId: string) {
    super(`Company not found: ${companyId}`);
    this.name = 'CompanyNotFoundException';
  }
}

export class CompanyAccessDeniedException extends DomainException {
  static readonly code = 'COMPANY_ACCESS_DENIED';
  static readonly httpStatus = 403;

  constructor(message: string = 'Access denied to company resource') {
    super(message);
    this.name = 'CompanyAccessDeniedException';
  }
}

export class CompanyAlreadyExistsException extends DomainException {
  static readonly code = 'COMPANY_ALREADY_EXISTS';
  static readonly httpStatus = 409;

  constructor(name: string) {
    super(`Company with this name already exists: ${name}`);
    this.name = 'CompanyAlreadyExistsException';
  }
}

export class InvalidCompanySizeException extends DomainException {
  static readonly code = 'INVALID_COMPANY_SIZE';
  static readonly httpStatus = 400;

  constructor(value: string, allowed: readonly string[]) {
    super(
      `Invalid company size: ${value}. Must be one of: ${allowed.join(', ')}`,
    );
    this.name = 'InvalidCompanySizeException';
  }
}
