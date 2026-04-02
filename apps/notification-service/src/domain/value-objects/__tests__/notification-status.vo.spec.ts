import { NotificationStatus } from "../notification-status.vo";

describe("NotificationStatus Value Object", () => {
  it("should create via factory method pending()", () => {
    const status = NotificationStatus.pending();
    expect(status.value).toBe("pending");
    expect(status.isPending()).toBe(true);
  });

  it("should create via factory method queued()", () => {
    const status = NotificationStatus.queued();
    expect(status.value).toBe("queued");
    expect(status.isQueued()).toBe(true);
  });

  it("should create via factory method sent()", () => {
    const status = NotificationStatus.sent();
    expect(status.value).toBe("sent");
    expect(status.isSent()).toBe(true);
  });

  it("should create via factory method failed()", () => {
    const status = NotificationStatus.failed();
    expect(status.value).toBe("failed");
    expect(status.isFailed()).toBe(true);
  });

  it("should create via factory method bounced()", () => {
    const status = NotificationStatus.bounced();
    expect(status.value).toBe("bounced");
    expect(status.isBounced()).toBe(true);
  });

  it("should create via generic create() with valid value", () => {
    const status = NotificationStatus.create("sent");
    expect(status.isSent()).toBe(true);
  });

  it("should throw on invalid status", () => {
    expect(() => NotificationStatus.create("unknown")).toThrow(
      "Invalid notification status: unknown",
    );
  });

  it("should return string representation", () => {
    const status = NotificationStatus.pending();
    expect(status.toString()).toBe("pending");
  });
});
