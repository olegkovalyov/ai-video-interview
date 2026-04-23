import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("@/lib/api/billing", () => ({
  getSubscription: vi.fn(),
  getUsage: vi.fn(),
  getPlans: vi.fn(),
  getInvoices: vi.fn(),
  createCheckoutSession: vi.fn(),
  createPortalSession: vi.fn(),
  cancelSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
}));

import {
  getSubscription,
  getUsage,
  getInvoices,
  createCheckoutSession,
  cancelSubscription,
  resumeSubscription,
} from "@/lib/api/billing";
import {
  useSubscription,
  useUsage,
  useInvoices,
  useCreateCheckoutSession,
  useCancelSubscription,
  useResumeSubscription,
} from "../use-billing";
import { billingKeys } from "../../query-keys";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  return { Wrapper, queryClient };
}

const subscriptionFixture = {
  id: "s1",
  companyId: "c1",
  planType: "plus" as const,
  planName: "Plus",
  status: "active" as const,
  limits: { interviewsPerMonth: 100, maxTemplates: 50, maxTeamMembers: 5 },
  features: [],
  stripeCustomerId: "cus_1",
  currentPeriodStart: "2026-04-01",
  currentPeriodEnd: "2026-05-01",
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialEnd: null,
  createdAt: "2026-01-01",
};

describe("useSubscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches current subscription", async () => {
    vi.mocked(getSubscription).mockResolvedValue(subscriptionFixture);

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useSubscription(), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(subscriptionFixture);
    expect(getSubscription).toHaveBeenCalledTimes(1);
  });

  it("does not fetch when disabled", () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useSubscription(false), { wrapper: Wrapper });
    expect(getSubscription).not.toHaveBeenCalled();
  });
});

describe("useUsage", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes period param to API call", async () => {
    vi.mocked(getUsage).mockResolvedValue({
      period: "2026-03",
      planType: "plus",
      interviews: { used: 10, limit: 100, remaining: 90 },
      templates: { used: 2, limit: 50, remaining: 48 },
      teamMembers: { used: 1, limit: 5, remaining: 4 },
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useUsage("2026-03"), {
      wrapper: Wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getUsage).toHaveBeenCalledWith("2026-03");
  });
});

describe("useInvoices", () => {
  beforeEach(() => vi.clearAllMocks());

  it("fetches with default limit", async () => {
    vi.mocked(getInvoices).mockResolvedValue([]);
    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useInvoices(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(getInvoices).toHaveBeenCalledWith(10);
  });

  it("does not fetch when disabled", () => {
    const { Wrapper } = createWrapper();
    renderHook(() => useInvoices(10, false), { wrapper: Wrapper });
    expect(getInvoices).not.toHaveBeenCalled();
  });
});

describe("useCreateCheckoutSession", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls createCheckoutSession with planType and optional URLs", async () => {
    vi.mocked(createCheckoutSession).mockResolvedValue({
      checkoutUrl: "https://stripe.test/checkout",
      sessionId: "cs_test",
    });

    const { Wrapper } = createWrapper();
    const { result } = renderHook(() => useCreateCheckoutSession(), {
      wrapper: Wrapper,
    });

    result.current.mutate({
      planType: "plus",
      successUrl: "http://local/success",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createCheckoutSession).toHaveBeenCalledWith(
      "plus",
      "http://local/success",
      undefined,
    );
    expect(result.current.data?.checkoutUrl).toContain("stripe.test");
  });
});

describe("useCancelSubscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalidates subscription cache on success", async () => {
    vi.mocked(cancelSubscription).mockResolvedValue({ message: "ok" });

    const { Wrapper, queryClient } = createWrapper();
    // Pre-populate subscription cache to verify invalidation.
    queryClient.setQueryData(billingKeys.subscription(), subscriptionFixture);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useCancelSubscription(), {
      wrapper: Wrapper,
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: billingKeys.subscription(),
    });
  });
});

describe("useResumeSubscription", () => {
  beforeEach(() => vi.clearAllMocks());

  it("invalidates subscription cache on success", async () => {
    vi.mocked(resumeSubscription).mockResolvedValue({ message: "ok" });

    const { Wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useResumeSubscription(), {
      wrapper: Wrapper,
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: billingKeys.subscription(),
    });
  });
});
