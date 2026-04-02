import { gw, uuid, cleanTestDatabases } from "../helpers";

describe("User Service Flow", () => {
  beforeAll(async () => {
    await cleanTestDatabases();
  });

  const userId = uuid();

  it("should create a user via internal endpoint", async () => {
    const { status, data } = await gw("/api/users", {
      method: "POST",
      userId,
      role: "admin",
      body: {
        userId,
        externalAuthId: `keycloak-${userId}`,
        email: `user-${Date.now()}@test.com`,
        firstName: "Test",
        lastName: "User",
      },
    });

    expect(status).toBeLessThan(300);
  });

  it("should get user profile", async () => {
    const { status, data } = await gw("/api/users/me", { userId });

    expect(status).toBe(200);
    expect(data.firstName).toBe("Test");
    expect(data.lastName).toBe("User");
  });

  it("should update user profile", async () => {
    const { status } = await gw("/api/users/me", {
      method: "PUT",
      userId,
      body: { firstName: "Updated", lastName: "Name" },
    });

    expect(status).toBe(200);
  });

  it("should return updated profile", async () => {
    const { status, data } = await gw("/api/users/me", { userId });

    expect(status).toBe(200);
    expect(data.firstName).toBe("Updated");
  });

  it("should return 404 for non-existent user", async () => {
    const { status } = await gw("/api/users/me", { userId: uuid() });

    expect(status).toBe(404);
  });
});
