import { DomainException } from '../../shared/exceptions/domain.exception';

export class InvalidScoreException extends DomainException {
  constructor(value: number) {
    super(`Invalid score value: ${value}. Score must be between 0 and 100.`);
  }
}

export class InvalidStatusTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(`Invalid status transition from '${from}' to '${to}'.`);
  }
}

export class AnalysisAlreadyCompletedException extends DomainException {
  constructor(analysisId: string) {
    super(`Analysis ${analysisId} is already completed and cannot be modified.`);
  }
}

export class AnalysisNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`Analysis not found: ${identifier}`);
  }
}

export class AnalysisAlreadyExistsException extends DomainException {
  constructor(invitationId: string) {
    super(`Analysis already exists for invitation: ${invitationId}`);
  }
}

export class QuestionAnalysisNotFoundException extends DomainException {
  constructor(questionId: string) {
    super(`Question analysis not found for question: ${questionId}`);
  }
}
