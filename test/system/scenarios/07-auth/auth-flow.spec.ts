import { gw, uuid } from "../../helpers";

/**
 * Tests authentication flows through the API Gateway.
 *
 * NOTE: Full Keycloak OIDC tests require a running Keycloak instance.
 * These tests verify the internal token bypass and error handling
 * without a real Keycloak server.
 */
describe("[07-auth] Authentication & Authorization", () => {
  it("should allow access with valid internal token", async () => {
    const { status } = await gw("/api/billing/plans", {
      userId: uuid(),
      role: "admin",
    });

    // Internal token bypass should work
    expect(status).toBe(200);
  });

  it("should reject request without any token", async () => {
    const res = await fetch("http://localhost:9010/api/users/me", {
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(401);
  });

  it("should reject request with invalid internal token", async () => {
    const res = await fetch("http://localhost:9010/api/users/me", {
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": "wrong-token",
        "x-user-id": uuid(),
      },
    });

    expect(res.status).toBe(401);
  });

  it("should reject request with invalid JWT", async () => {
    const res = await fetch("http://localhost:9010/api/users/me", {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer invalid.jwt.token",
      },
    });

    expect(res.status).toBe(401);
  });

  it("should propagate user role from internal token", async () => {
    const userId = uuid();

    // Access as HR should be allowed for HR-only endpoints
    const { status: hrStatus } = await gw("/api/templates", {
      userId,
      role: "hr",
    });

    // The request itself may fail (no templates) but should NOT be 401/403
    expect(hrStatus).not.toBe(401);
    expect(hrStatus).not.toBe(403);
  });

  it("should allow public endpoints without authentication", async () => {
    const res = await fetch("http://localhost:9010/health");

    expect(res.status).toBe(200);
  });
});
