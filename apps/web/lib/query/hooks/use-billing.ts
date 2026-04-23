import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { billingKeys } from "../query-keys";
import {
  cancelSubscription,
  createCheckoutSession,
  createPortalSession,
  getInvoices,
  getPlans,
  getSubscription,
  getUsage,
  resumeSubscription,
  type PlanType,
} from "@/lib/api/billing";

/**
 * Current subscription (plan, status, period, Stripe ids).
 * Stale time: 30s — state changes via webhook are visible after
 * cache invalidation or ≤30s idle refresh.
 */
export function useSubscription(enabled = true) {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: getSubscription,
    enabled,
    staleTime: 30_000,
  });
}

/**
 * Per-period usage counters (interviews/templates/team members).
 * Short stale time because this drives the "you can still create N more"
 * banner — we want it fresh right after a create/cancel.
 */
export function useUsage(period?: string, enabled = true) {
  return useQuery({
    queryKey: billingKeys.usage(period),
    queryFn: () => getUsage(period),
    enabled,
    staleTime: 15_000,
  });
}

/**
 * Public plan catalog for pricing/marketing pages.
 * Essentially static — cache aggressively.
 */
export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: getPlans,
    staleTime: 10 * 60_000,
  });
}

/** Invoice history from Stripe (cached 5 min server-side). */
export function useInvoices(limit = 10, enabled = true) {
  return useQuery({
    queryKey: billingKeys.invoices(limit),
    queryFn: () => getInvoices(limit),
    enabled,
    staleTime: 60_000,
  });
}

/**
 * Start a Stripe Checkout flow.
 * Does NOT redirect — caller receives the URL and chooses when to navigate
 * (we redirect via window.location to break out of the SPA into Stripe's domain).
 */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: (args: {
      planType: Exclude<PlanType, "free">;
      successUrl?: string;
      cancelUrl?: string;
    }) => createCheckoutSession(args.planType, args.successUrl, args.cancelUrl),
  });
}

/** Create Stripe Customer Portal session (manage cards, past invoices). */
export function useCreatePortalSession() {
  return useMutation({
    mutationFn: createPortalSession,
  });
}

export function useCancelSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: cancelSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.subscription() });
    },
  });
}

export function useResumeSubscription() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: resumeSubscription,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.subscription() });
    },
  });
}
