import { gw, direct, uuid, cleanTestDatabases } from "../helpers";

describe("Billing & Quota Flow", () => {
  beforeAll(async () => {
    await cleanTestDatabases();
  });

  it("should list available plans via gateway", async () => {
    const { status, data } = await gw("/api/billing/plans", {
      userId: uuid(),
      role: "admin",
    });

    expect(status).toBe(200);
    expect(data).toHaveLength(3);
    expect(data.map((p: any) => p.type)).toEqual(["free", "plus", "pro"]);
  });

  it("should list plans via direct service call", async () => {
    const { status, data } = await direct("billing", "/api/billing/plans");

    expect(status).toBe(200);
    expect(data).toHaveLength(3);
  });

  it("should check quota via direct service call", async () => {
    const companyId = uuid();
    const { status, data } = await direct(
      "billing",
      `/api/billing/internal/quota/${companyId}/interviews`,
    );

    expect(status).toBe(200);
    expect(data.allowed).toBeDefined();
    expect(data.currentPlan).toBe("free");
  });
});
