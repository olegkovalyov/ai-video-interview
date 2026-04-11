import { DomainException } from './domain.exception';

export class AccessDeniedException extends DomainException {
  constructor(message: string = 'Access denied') {
    super(message);
    this.name = 'AccessDeniedException';
  }
}
