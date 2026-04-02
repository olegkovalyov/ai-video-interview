import { ListNotificationsHandler } from "../list-notifications.handler";
import { ListNotificationsQuery } from "../list-notifications.query";
import { Notification } from "../../../../domain/aggregates/notification.aggregate";
import type { INotificationRepository } from "../../../../domain/repositories/notification.repository.interface";

describe("ListNotificationsHandler", () => {
  let handler: ListNotificationsHandler;
  let notificationRepo: jest.Mocked<INotificationRepository>;

  const createNotification = (id: string, template: string) => {
    return Notification.reconstitute({
      id,
      recipientId: "user-123",
      recipientEmail: "user@example.com",
      channel: "email",
      template: template as any,
      status: "sent",
      data: {},
      sentAt: new Date("2026-03-01T12:00:00Z"),
      error: null,
      retryCount: 0,
      createdAt: new Date("2026-03-01T10:00:00Z"),
    });
  };

  beforeEach(() => {
    notificationRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRecipientId: jest.fn().mockResolvedValue([]),
      findUnread: jest.fn(),
      countUnread: jest.fn(),
    };

    handler = new ListNotificationsHandler(notificationRepo);
  });

  it("should return notifications for the given userId", async () => {
    const notifications = [
      createNotification("n-1", "welcome"),
      createNotification("n-2", "invitation"),
    ];
    notificationRepo.findByRecipientId.mockResolvedValue(notifications);

    const query = new ListNotificationsQuery("user-123");
    const result = await handler.execute(query);

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe("n-1");
    expect(result[0].template).toBe("welcome");
    expect(result[1].id).toBe("n-2");
    expect(notificationRepo.findByRecipientId).toHaveBeenCalledWith(
      "user-123",
      { limit: 20, offset: 0 },
    );
  });

  it("should pass pagination parameters", async () => {
    notificationRepo.findByRecipientId.mockResolvedValue([]);

    const query = new ListNotificationsQuery("user-123", 10, 5);
    await handler.execute(query);

    expect(notificationRepo.findByRecipientId).toHaveBeenCalledWith(
      "user-123",
      { limit: 10, offset: 5 },
    );
  });

  it("should return empty array when no notifications exist", async () => {
    notificationRepo.findByRecipientId.mockResolvedValue([]);

    const query = new ListNotificationsQuery("user-123");
    const result = await handler.execute(query);

    expect(result).toEqual([]);
  });

  it("should map sentAt and createdAt to ISO strings", async () => {
    const notifications = [createNotification("n-1", "welcome")];
    notificationRepo.findByRecipientId.mockResolvedValue(notifications);

    const query = new ListNotificationsQuery("user-123");
    const result = await handler.execute(query);

    expect(result[0].sentAt).toBe("2026-03-01T12:00:00.000Z");
    expect(result[0].createdAt).toBe("2026-03-01T10:00:00.000Z");
  });
});
