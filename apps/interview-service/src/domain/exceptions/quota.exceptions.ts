import { DomainException } from './interview-template.exceptions';

/**
 * Thrown when a company has reached its plan quota for a resource
 * (e.g. max interviews/month on free plan). Maps to HTTP 402 Payment Required.
 */
export class QuotaExceededException extends DomainException {
  public readonly resource: string;
  public readonly currentPlan: string;
  public readonly limit: number;

  constructor(resource: string, currentPlan: string, limit: number) {
    super(
      `Quota exceeded: ${resource} limit of ${limit} reached on ${currentPlan} plan`,
    );
    this.resource = resource;
    this.currentPlan = currentPlan;
    this.limit = limit;
  }
}
