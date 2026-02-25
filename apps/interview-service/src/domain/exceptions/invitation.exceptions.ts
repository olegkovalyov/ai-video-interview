import { DomainException } from './interview-template.exceptions';

/**
 * Invitation not found
 */
export class InvitationNotFoundException extends DomainException {
  constructor(invitationId: string) {
    super(`Invitation with id ${invitationId} not found`);
  }
}

/**
 * Invitation has expired
 */
export class InvitationExpiredException extends DomainException {
  constructor(invitationId: string) {
    super(`Invitation ${invitationId} has expired`);
  }
}

/**
 * Access denied for invitation operation
 */
export class InvitationAccessDeniedException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Invalid invitation state for the requested operation
 */
export class InvalidInvitationStateException extends DomainException {
  constructor(operation: string, currentState: string) {
    super(`Cannot ${operation} invitation in ${currentState} state`);
  }
}

/**
 * Duplicate response for a question
 */
export class DuplicateResponseException extends DomainException {
  constructor(questionId: string) {
    super(`Response for question ${questionId} already exists`);
  }
}

/**
 * Duplicate invitation for candidate + template combination
 */
export class DuplicateInvitationException extends DomainException {
  constructor(candidateId: string, templateId: string) {
    super(
      `Invitation for candidate ${candidateId} to template ${templateId} already exists`,
    );
  }
}

/**
 * Invitation cannot be completed — not all questions answered
 */
export class InvitationIncompleteException extends DomainException {
  constructor(answered: number, total: number) {
    super(`Cannot complete: ${answered}/${total} questions answered`);
  }
}

/**
 * Invalid invitation data during creation
 */
export class InvalidInvitationDataException extends DomainException {
  constructor(reason: string) {
    super(`Invalid invitation data: ${reason}`);
  }
}
