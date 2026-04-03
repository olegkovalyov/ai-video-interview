import {
  gw,
  direct,
  seedUser,
  uuid,
  cleanTestDatabases,
  waitForAsyncDrain,
} from "../../helpers";

describe("[01-sync-http] User CRUD via Gateway", () => {
  beforeAll(async () => {
    await cleanTestDatabases();
  });

  const userId = uuid();

  it("should create a user via direct service call", async () => {
    await seedUser({
      userId,
      email: `user-${Date.now()}@test.com`,
      firstName: "Test",
      lastName: "User",
    });
  });

  it("should get user profile via gateway", async () => {
    const { status, data } = await gw("/api/users/me", { userId });

    expect(status).toBe(200);
    expect(data.firstName).toBe("Test");
    expect(data.lastName).toBe("User");
  });

  it("should update user profile via gateway", async () => {
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

  it("should handle non-existent user via gateway", async () => {
    const { status } = await gw("/api/users/me", { userId: uuid() });
    expect(status).toBeGreaterThanOrEqual(400);
  });

  afterAll(async () => {
    await waitForAsyncDrain();
  });
});
