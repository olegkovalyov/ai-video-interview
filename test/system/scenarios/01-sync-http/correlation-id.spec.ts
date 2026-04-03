import { gw, uuid } from "../../helpers";

describe("[01-sync-http] Correlation ID Propagation", () => {
  it("should handle downstream service errors gracefully", async () => {
    const { status } = await gw("/api/users/me", { userId: uuid() });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  it("should propagate correlation-id across services", async () => {
    const correlationId = `test-corr-${Date.now()}`;
    const { headers } = await gw("/api/billing/plans", {
      userId: uuid(),
      role: "admin",
      headers: { "x-correlation-id": correlationId },
    });
    expect(headers.get("x-correlation-id")).toBe(correlationId);
  });

  it("should generate correlation-id when not provided", async () => {
    const { headers } = await gw("/api/billing/plans", {
      userId: uuid(),
      role: "admin",
    });
    const cid = headers.get("x-correlation-id");
    expect(cid).toBeDefined();
    expect(cid!.length).toBeGreaterThan(0);
  });
});
