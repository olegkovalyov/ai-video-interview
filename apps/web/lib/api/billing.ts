/**
 * Billing API Client
 * Methods for working with Billing Service via API Gateway.
 * All authenticated endpoints rely on api-gateway to derive companyId from the JWT.
 */

import { apiGet, apiPost } from "@/lib/api";

// ========================================
// TYPES (mirror billing-service DTOs)
// ========================================

export type PlanType = "free" | "plus" | "pro";

export type SubscriptionStatus =
  | "active"
  | "past_due"
  | "canceled"
  | "trialing";

export interface PlanLimits {
  interviewsPerMonth: number; // -1 = unlimited
  maxTemplates: number;
  maxTeamMembers: number;
}

export interface Subscription {
  id: string;
  companyId: string;
  planType: PlanType;
  planName: string;
  status: SubscriptionStatus;
  limits: PlanLimits;
  features: string[];
  stripeCustomerId: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
  trialEnd: string | null;
  createdAt: string;
}

export interface UsageItem {
  used: number;
  limit: number; // -1 = unlimited
  remaining: number;
}

export interface Usage {
  period: string; // YYYY-MM
  planType: PlanType;
  interviews: UsageItem;
  templates: UsageItem;
  teamMembers: UsageItem;
}

export interface Plan {
  type: PlanType;
  name: string;
  priceMonthly: number; // cents
  limits: PlanLimits;
  features: string[];
}

export interface CheckoutSessionResponse {
  checkoutUrl: string;
  sessionId: string;
}

export interface PortalSessionResponse {
  portalUrl: string | null;
  message?: string;
}

export interface Invoice {
  id: string;
  amountCents: number;
  currency: string;
  status: "paid" | "open" | "void" | "draft";
  pdfUrl?: string;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
}

// ========================================
// API FUNCTIONS
// ========================================

export function getSubscription(): Promise<Subscription> {
  return apiGet<Subscription>("/api/billing/subscription");
}

export function getUsage(period?: string): Promise<Usage> {
  const query = period ? `?period=${encodeURIComponent(period)}` : "";
  return apiGet<Usage>(`/api/billing/usage${query}`);
}

export function getPlans(): Promise<Plan[]> {
  return apiGet<Plan[]>("/api/billing/plans");
}

export function getInvoices(limit = 10): Promise<Invoice[]> {
  return apiGet<Invoice[]>(`/api/billing/invoices?limit=${limit}`);
}

export function createCheckoutSession(
  planType: Exclude<PlanType, "free">,
  successUrl?: string,
  cancelUrl?: string,
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>("/api/billing/checkout", {
    planType,
    ...(successUrl ? { successUrl } : {}),
    ...(cancelUrl ? { cancelUrl } : {}),
  });
}

export function createPortalSession(): Promise<PortalSessionResponse> {
  return apiPost<PortalSessionResponse>("/api/billing/portal", {});
}

export function cancelSubscription(): Promise<{ message: string }> {
  return apiPost<{ message: string }>("/api/billing/cancel", {});
}

export function resumeSubscription(): Promise<{ message: string }> {
  return apiPost<{ message: string }>("/api/billing/resume", {});
}
