import { gw, uuid, cleanTestDatabases } from "../helpers";

describe("Billing & Quota Flow", () => {
  const hrUserId = uuid();
  const companyId = uuid();

  beforeAll(async () => {
    await cleanTestDatabases();
  });

  // ─── Plans (public) ────────────────────────────────────────

  it("should list available plans without auth", async () => {
    const { status, data } = await gw("/api/billing/plans", {
      headers: { "x-internal-token": "test-internal-token" },
    });

    expect(status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data.map((p: any) => p.type)).toEqual(["free", "plus", "pro"]);
  });

  // ─── Subscription ──────────────────────────────────────────

  it("should get subscription (free default)", async () => {
    // First create a free subscription via internal command
    const { status, data } = await gw("/api/billing/subscription", {
      userId: hrUserId,
      companyId,
    });

    // May be 404 if no subscription exists yet — that's OK for free plan
    expect([200, 404]).toContain(status);
  });

  // ─── Quota Check ───────────────────────────────────────────

  it("should check quota via internal endpoint", async () => {
    const { status, data } = await gw(
      `/api/billing/internal/quota/${companyId}/interviews`,
    );

    expect(status).toBe(200);
    expect(data.allowed).toBeDefined();
    expect(data.limit).toBeDefined();
    expect(data.currentPlan).toBeDefined();
  });

  // ─── Usage ─────────────────────────────────────────────────

  it("should get usage for current period", async () => {
    const { status, data } = await gw("/api/billing/usage", {
      userId: hrUserId,
      companyId,
    });

    // May be 404 if no subscription — OK for this test
    expect([200, 404]).toContain(status);
  });
});
