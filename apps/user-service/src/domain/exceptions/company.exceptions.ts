import { DomainException } from './domain.exception';

/**
 * Company-specific domain exceptions
 */

export class CompanyNotFoundException extends DomainException {
  constructor(companyId: string) {
    super(`Company not found: ${companyId}`);
    this.name = 'CompanyNotFoundException';
  }
}

export class CompanyAccessDeniedException extends DomainException {
  constructor(message: string = 'Access denied to company resource') {
    super(message);
    this.name = 'CompanyAccessDeniedException';
  }
}
