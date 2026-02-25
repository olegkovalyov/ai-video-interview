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

export class NoQuestionsAnalyzedException extends DomainException {
  constructor(analysisId: string) {
    super(`Cannot complete analysis ${analysisId}: no questions were analyzed.`);
  }
}

export class InvalidCriterionTypeException extends DomainException {
  constructor(criterion: string) {
    super(`Invalid criterion type: '${criterion}'. Valid values: relevance, completeness, clarity, depth.`);
  }
}

export class InvalidAnalysisStatusException extends DomainException {
  constructor(status: string) {
    super(`Invalid analysis status: '${status}'. Valid values: pending, in_progress, completed, failed.`);
  }
}

export class InvalidQuestionTypeException extends DomainException {
  constructor(type: string) {
    super(`Invalid question type: '${type}'. Valid values: text, multiple_choice, coding, video.`);
  }
}

export class InvalidRecommendationException extends DomainException {
  constructor(value: string) {
    super(`Invalid recommendation: '${value}'. Valid values: hire, consider, reject.`);
  }
}
