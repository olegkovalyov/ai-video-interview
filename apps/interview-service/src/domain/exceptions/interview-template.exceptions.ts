/**
 * Base Domain Exception
 */
export abstract class DomainException extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Template not found
 */
export class TemplateNotFoundException extends DomainException {
  constructor(templateId: string) {
    super(`Interview template with id ${templateId} not found`);
  }
}

/**
 * Template already published
 */
export class TemplateAlreadyPublishedException extends DomainException {
  constructor(templateId: string) {
    super(`Template ${templateId} is already published`);
  }
}

/**
 * Template cannot be published (no questions)
 */
export class TemplateCannotBePublishedException extends DomainException {
  constructor(reason: string) {
    super(`Template cannot be published: ${reason}`);
  }
}

/**
 * Question not found in template
 */
export class QuestionNotFoundException extends DomainException {
  constructor(questionId: string) {
    super(`Question with id ${questionId} not found in template`);
  }
}

/**
 * Invalid template state for operation
 */
export class InvalidTemplateStateException extends DomainException {
  constructor(operation: string, currentState: string) {
    super(`Cannot ${operation} template in ${currentState} state`);
  }
}

/**
 * Template is archived
 */
export class TemplateArchivedException extends DomainException {
  constructor(templateId: string) {
    super(`Template ${templateId} is archived and cannot be modified`);
  }
}

/**
 * Duplicate question order
 */
export class DuplicateQuestionOrderException extends DomainException {
  constructor(order: number) {
    super(`Question with order ${order} already exists in template`);
  }
}

/**
 * Invalid question data
 */
export class InvalidQuestionException extends DomainException {
  constructor(reason: string) {
    super(`Invalid question: ${reason}`);
  }
}

/**
 * Unauthorized access to template
 */
export class TemplateUnauthorizedException extends DomainException {
  constructor(userId: string, templateId: string) {
    super(`User ${userId} is not authorized to access template ${templateId}`);
  }
}

/**
 * Invalid template metadata
 */
export class InvalidTemplateMetadataException extends DomainException {
  constructor(field: string, reason: string) {
    super(`Invalid template ${field}: ${reason}`);
  }
}
