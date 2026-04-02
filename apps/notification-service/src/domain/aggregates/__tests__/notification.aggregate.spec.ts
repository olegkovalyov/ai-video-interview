import { Notification } from "../notification.aggregate";
import { NotificationSentEvent } from "../../events/notification-sent.event";
import { NotificationFailedEvent } from "../../events/notification-failed.event";

describe("Notification Aggregate", () => {
  const createPendingNotification = (id = "notif-1") => {
    return Notification.create({
      id,
      recipientId: "user-123",
      recipientEmail: "user@example.com",
      channel: "email",
      template: "welcome",
      data: { name: "John" },
    });
  };

  const createQueuedNotification = (id = "notif-1") => {
    const notification = createPendingNotification(id);
    notification.markQueued();
    return notification;
  };

  const createSentNotification = (id = "notif-1") => {
    const notification = createQueuedNotification(id);
    notification.markSent();
    return notification;
  };

  describe("create()", () => {
    it("should create a notification with email channel", () => {
      const notification = createPendingNotification();

      expect(notification.id).toBe("notif-1");
      expect(notification.recipientId).toBe("user-123");
      expect(notification.recipientEmail).toBe("user@example.com");
      expect(notification.channel).toBe("email");
      expect(notification.template).toBe("welcome");
      expect(notification.status).toBe("pending");
      expect(notification.data).toEqual({ name: "John" });
      expect(notification.sentAt).toBeNull();
      expect(notification.error).toBeNull();
      expect(notification.retryCount).toBe(0);
      expect(notification.createdAt).toBeInstanceOf(Date);
    });

    it("should create a notification with in_app channel", () => {
      const notification = Notification.create({
        id: "notif-2",
        recipientId: "user-123",
        recipientEmail: "user@example.com",
        channel: "in_app",
        template: "invitation",
        data: {},
      });

      expect(notification.channel).toBe("in_app");
      expect(notification.template).toBe("invitation");
    });

    it("should create a notification with webhook channel", () => {
      const notification = Notification.create({
        id: "notif-3",
        recipientId: "user-123",
        recipientEmail: "user@example.com",
        channel: "webhook",
        template: "analysis_ready",
        data: { analysisId: "a-1" },
      });

      expect(notification.channel).toBe("webhook");
    });

    it("should not emit domain events on create", () => {
      const notification = createPendingNotification();
      expect(notification.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe("reconstitute()", () => {
    it("should reconstitute without emitting events", () => {
      const notification = Notification.reconstitute({
        id: "notif-1",
        recipientId: "user-123",
        recipientEmail: "user@example.com",
        channel: "email",
        template: "welcome",
        status: "sent",
        data: { name: "John" },
        sentAt: new Date(),
        error: null,
        retryCount: 0,
        createdAt: new Date(),
      });

      expect(notification.status).toBe("sent");
      expect(notification.getUncommittedEvents()).toHaveLength(0);
    });
  });

  describe("markQueued()", () => {
    it("should transition from pending to queued", () => {
      const notification = createPendingNotification();
      notification.markQueued();
      expect(notification.status).toBe("queued");
    });

    it("should transition from failed to queued (retry)", () => {
      const notification = createPendingNotification();
      notification.markFailed("timeout");
      notification.markQueued();
      expect(notification.status).toBe("queued");
    });

    it("should throw when transitioning from sent to queued", () => {
      const notification = createSentNotification();
      expect(() => notification.markQueued()).toThrow(
        "Cannot queue notification in status: sent",
      );
    });

    it("should throw when transitioning from bounced to queued", () => {
      const notification = createSentNotification();
      notification.markBounced();
      expect(() => notification.markQueued()).toThrow(
        "Cannot queue notification in status: bounced",
      );
    });
  });

  describe("markSent()", () => {
    it("should transition from queued to sent", () => {
      const notification = createQueuedNotification();
      notification.markSent();

      expect(notification.status).toBe("sent");
      expect(notification.sentAt).toBeInstanceOf(Date);
      expect(notification.error).toBeNull();
    });

    it("should transition from pending to sent (in-app shortcut)", () => {
      const notification = createPendingNotification();
      notification.markSent();
      expect(notification.status).toBe("sent");
    });

    it("should emit NotificationSentEvent", () => {
      const notification = createQueuedNotification();
      notification.markSent();

      const events = notification.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(NotificationSentEvent);
      expect((events[0] as NotificationSentEvent).aggregateId).toBe("notif-1");
      expect((events[0] as NotificationSentEvent).recipientId).toBe("user-123");
    });

    it("should throw when transitioning from failed to sent", () => {
      const notification = createPendingNotification();
      notification.markFailed("error");
      expect(() => notification.markSent()).toThrow(
        "Cannot mark as sent from status: failed",
      );
    });
  });

  describe("markFailed()", () => {
    it("should mark notification as failed with error", () => {
      const notification = createPendingNotification();
      notification.markFailed("SMTP connection refused");

      expect(notification.status).toBe("failed");
      expect(notification.error).toBe("SMTP connection refused");
      expect(notification.retryCount).toBe(1);
    });

    it("should increment retryCount on each failure", () => {
      const notification = createPendingNotification();
      notification.markFailed("error 1");
      expect(notification.retryCount).toBe(1);

      notification.markQueued();
      notification.markFailed("error 2");
      expect(notification.retryCount).toBe(2);
    });

    it("should emit NotificationFailedEvent", () => {
      const notification = createPendingNotification();
      notification.markFailed("timeout");

      const events = notification.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(NotificationFailedEvent);

      const event = events[0] as NotificationFailedEvent;
      expect(event.aggregateId).toBe("notif-1");
      expect(event.recipientId).toBe("user-123");
      expect(event.error).toBe("timeout");
    });
  });

  describe("markBounced()", () => {
    it("should mark notification as bounced", () => {
      const notification = createSentNotification();
      notification.markBounced();

      expect(notification.status).toBe("bounced");
      expect(notification.error).toBe("Email bounced");
    });

    it("should emit NotificationFailedEvent on bounce", () => {
      const notification = createSentNotification();
      notification.markBounced();

      const events = notification.getUncommittedEvents();
      // sent event (1) + bounced event (1)
      const failedEvents = events.filter(
        (e) => e instanceof NotificationFailedEvent,
      );
      expect(failedEvents).toHaveLength(1);
      expect((failedEvents[0] as NotificationFailedEvent).error).toBe(
        "Email bounced",
      );
    });
  });

  describe("status transitions: full flow", () => {
    it("should support pending -> queued -> sent", () => {
      const notification = createPendingNotification();
      notification.markQueued();
      notification.markSent();
      expect(notification.status).toBe("sent");
    });

    it("should support pending -> queued -> failed", () => {
      const notification = createPendingNotification();
      notification.markQueued();
      notification.markFailed("error");
      expect(notification.status).toBe("failed");
    });

    it("should support sent -> bounced", () => {
      const notification = createSentNotification();
      notification.markBounced();
      expect(notification.status).toBe("bounced");
    });
  });
});
