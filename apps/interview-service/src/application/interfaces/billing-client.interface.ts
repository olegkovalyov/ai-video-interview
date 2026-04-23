/**
 * Result of quota check from billing-service.
 * - `allowed`: whether the requested resource action is within the plan limit
 * - `remaining`: remaining capacity; `-1` means unlimited
 * - `limit`: plan limit for this resource; `-1` means unlimited
 * - `currentPlan`: the plan identifier (e.g. "free", "plus", "pro")
 */
export interface QuotaCheckResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  currentPlan: string;
}

export type QuotaResource = 'interviews' | 'templates' | 'teamMembers';

/**
 * Port for billing-service interactions used by the interview domain.
 * Implementations live in the infrastructure layer and must be resilient
 * to transient failures (timeouts, 5xx).
 */
export interface IBillingClient {
  checkQuota(
    companyId: string,
    resource: QuotaResource,
  ): Promise<QuotaCheckResult>;
}

export const IBillingClientToken = 'IBillingClient';
