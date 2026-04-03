import { gw, uuid } from "../../helpers";

/**
 * Tests resilience patterns:
 * - Gateway error handling when downstream services return errors
 * - Correlation ID propagation through error paths
 * - Graceful degradation with partial data
 * - Timeout handling
 *
 * NOTE: Full circuit breaker tests require stopping/starting individual services.
 * These tests verify error handling at the HTTP level.
 */
describe("[08-resilience] Gateway Error Handling", () => {
  it("should return proper error for non-existent resource", async () => {
    const { status, data } = await gw(`/api/invitations/${uuid()}`, {
      userId: uuid(),
      role: "hr",
    });

    expect(status).toBeGreaterThanOrEqual(400);
    expect(status).toBeLessThan(500);
  });

  it("should preserve correlation-id in error responses", async () => {
    const correlationId = `resilience-${Date.now()}`;
    const { headers, status } = await gw(`/api/users/me`, {
      userId: uuid(),
      headers: { "x-correlation-id": correlationId },
    });

    // Even on error, correlation-id should be propagated
    expect(headers.get("x-correlation-id")).toBe(correlationId);
  });

  it("should handle malformed request body gracefully", async () => {
    const res = await fetch("http://localhost:9010/api/users/me", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": "test-internal-token",
        "x-user-id": uuid(),
        "x-user-role": "hr",
      },
      body: "not-valid-json{{{",
    });

    // Should return 400 (bad request), not 500
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it("should handle request to non-existent route with 404", async () => {
    const { status } = await gw("/api/nonexistent/route", {
      userId: uuid(),
    });

    expect(status).toBe(404);
  });
});

describe("[08-resilience] Rate Limiting & Timeouts", () => {
  it("should handle concurrent requests without errors", async () => {
    const userId = uuid();
    const requests = Array.from({ length: 10 }, () =>
      gw("/api/billing/plans", { userId, role: "admin" }),
    );

    const results = await Promise.all(requests);
    const statuses = results.map((r) => r.status);

    // All should succeed (or rate limited with 429)
    statuses.forEach((s) => {
      expect([200, 429]).toContain(s);
    });

    // At least some should succeed
    expect(statuses.filter((s) => s === 200).length).toBeGreaterThan(0);
  });
});

describe("[08-resilience] Health Checks", () => {
  const services = [
    { name: "api-gateway", url: "http://localhost:9010/health" },
    { name: "user-service", url: "http://localhost:9002/health" },
    { name: "interview-service", url: "http://localhost:9003/health" },
    { name: "billing-service", url: "http://localhost:9007/health" },
    { name: "notification-service", url: "http://localhost:9006/health" },
    { name: "ai-analysis-service", url: "http://localhost:9005/health" },
  ];

  for (const svc of services) {
    it(`${svc.name} should respond to health check`, async () => {
      const res = await fetch(svc.url);
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.status).toBeDefined();
    });
  }
});
