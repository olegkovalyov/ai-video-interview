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
 * Subscription not found
 */
export class SubscriptionNotFoundException extends DomainException {
  constructor(identifier: string) {
    super(`Subscription not found: ${identifier}`);
  }
}

/**
 * Invalid plan transition (e.g., free cannot downgrade)
 */
export class InvalidPlanTransitionException extends DomainException {
  constructor(currentPlan: string, targetPlan: string) {
    super(`Cannot transition from plan '${currentPlan}' to '${targetPlan}'`);
  }
}

/**
 * Quota exceeded for the current plan
 */
export class QuotaExceededException extends DomainException {
  constructor(resource: string, limit: number, currentPlan: string) {
    super(
      `Quota exceeded for '${resource}': limit is ${limit} on '${currentPlan}' plan`,
    );
  }
}

/**
 * Duplicate subscription for a company
 */
export class DuplicateSubscriptionException extends DomainException {
  constructor(companyId: string) {
    super(`Company ${companyId} already has an active subscription`);
  }
}

/**
 * Payment required (e.g., plan upgrade needed)
 */
export class PaymentRequiredException extends DomainException {
  constructor(message: string) {
    super(message);
  }
}

/**
 * Invalid subscription state for the requested operation
 */
export class InvalidSubscriptionStateException extends DomainException {
  constructor(operation: string, currentState: string) {
    super(`Cannot ${operation} subscription in '${currentState}' state`);
  }
}
