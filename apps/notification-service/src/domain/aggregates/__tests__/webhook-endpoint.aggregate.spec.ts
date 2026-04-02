import { WebhookEndpoint } from "../webhook-endpoint.aggregate";

describe("WebhookEndpoint Aggregate", () => {
  const createEndpoint = (id = "wh-1") => {
    return WebhookEndpoint.create({
      id,
      companyId: "company-123",
      url: "https://example.com/webhook",
      secret: "secret-abc",
      events: ["notification.sent", "analysis.completed"],
    });
  };

  describe("create()", () => {
    it("should create an active endpoint with zero failures", () => {
      const endpoint = createEndpoint();

      expect(endpoint.id).toBe("wh-1");
      expect(endpoint.companyId).toBe("company-123");
      expect(endpoint.url).toBe("https://example.com/webhook");
      expect(endpoint.secret).toBe("secret-abc");
      expect(endpoint.events).toEqual([
        "notification.sent",
        "analysis.completed",
      ]);
      expect(endpoint.status).toBe("active");
      expect(endpoint.failureCount).toBe(0);
      expect(endpoint.lastDeliveryAt).toBeNull();
      expect(endpoint.createdAt).toBeInstanceOf(Date);
    });

    it("should return a defensive copy of events", () => {
      const endpoint = createEndpoint();
      const events = endpoint.events;
      events.push("malicious.event");
      expect(endpoint.events).toHaveLength(2);
    });
  });

  describe("reconstitute()", () => {
    it("should reconstitute without emitting events", () => {
      const endpoint = WebhookEndpoint.reconstitute({
        id: "wh-1",
        companyId: "company-123",
        url: "https://example.com/webhook",
        secret: "secret-abc",
        events: ["notification.sent"],
        status: "disabled",
        failureCount: 5,
        lastDeliveryAt: new Date(),
        createdAt: new Date(),
      });

      expect(endpoint.status).toBe("disabled");
      expect(endpoint.failureCount).toBe(5);
      expect(endpoint.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe("recordFailure()", () => {
    it("should increment failure count", () => {
      const endpoint = createEndpoint();
      endpoint.recordFailure();
      expect(endpoint.failureCount).toBe(1);
    });

    it("should auto-disable after 10 failures", () => {
      const endpoint = createEndpoint();
      for (let i = 0; i < 10; i++) {
        endpoint.recordFailure();
      }
      expect(endpoint.failureCount).toBe(10);
      expect(endpoint.status).toBe("disabled");
      expect(endpoint.isActive()).toBe(false);
    });

    it("should not auto-disable before 10 failures", () => {
      const endpoint = createEndpoint();
      for (let i = 0; i < 9; i++) {
        endpoint.recordFailure();
      }
      expect(endpoint.status).toBe("active");
    });
  });

  describe("recordSuccess()", () => {
    it("should reset failure count and update lastDeliveryAt", () => {
      const endpoint = createEndpoint();
      endpoint.recordFailure();
      endpoint.recordFailure();
      expect(endpoint.failureCount).toBe(2);

      endpoint.recordSuccess();
      expect(endpoint.failureCount).toBe(0);
      expect(endpoint.lastDeliveryAt).toBeInstanceOf(Date);
    });
  });

  describe("disable()", () => {
    it("should set status to disabled", () => {
      const endpoint = createEndpoint();
      endpoint.disable();
      expect(endpoint.status).toBe("disabled");
      expect(endpoint.isActive()).toBe(false);
    });
  });

  describe("enable()", () => {
    it("should set status to active and reset failure count", () => {
      const endpoint = createEndpoint();
      endpoint.recordFailure();
      endpoint.recordFailure();
      endpoint.disable();

      endpoint.enable();
      expect(endpoint.status).toBe("active");
      expect(endpoint.failureCount).toBe(0);
      expect(endpoint.isActive()).toBe(true);
    });
  });

  describe("isSubscribedTo()", () => {
    it("should return true for subscribed events", () => {
      const endpoint = createEndpoint();
      expect(endpoint.isSubscribedTo("notification.sent")).toBe(true);
      expect(endpoint.isSubscribedTo("analysis.completed")).toBe(true);
    });

    it("should return false for unsubscribed events", () => {
      const endpoint = createEndpoint();
      expect(endpoint.isSubscribedTo("user.created")).toBe(false);
    });
  });
});
