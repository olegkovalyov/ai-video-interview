import { SendNotificationHandler } from "../send-notification.handler";
import { SendNotificationCommand } from "../send-notification.command";
import type { INotificationRepository } from "../../../../domain/repositories/notification.repository.interface";
import type { INotificationPreferenceRepository } from "../../../../domain/repositories/notification-preference.repository.interface";
import type { IEmailService } from "../../../interfaces/email-service.interface";
import type { IOutboxService } from "../../../interfaces/outbox-service.interface";
import type { IUnitOfWork } from "../../../interfaces/unit-of-work.interface";
import { NotificationPreference } from "../../../../domain/entities/notification-preference.entity";

describe("SendNotificationHandler", () => {
  let handler: SendNotificationHandler;
  let notificationRepo: jest.Mocked<INotificationRepository>;
  let preferenceRepo: jest.Mocked<INotificationPreferenceRepository>;
  let emailService: jest.Mocked<IEmailService>;
  let outboxService: jest.Mocked<IOutboxService>;
  let unitOfWork: jest.Mocked<IUnitOfWork>;
  let logger: any;

  beforeEach(() => {
    notificationRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByRecipientId: jest.fn(),
      findUnread: jest.fn(),
      countUnread: jest.fn(),
    };

    preferenceRepo = {
      save: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue(null),
    };

    emailService = {
      send: jest.fn().mockResolvedValue(undefined),
    };

    outboxService = {
      saveEvent: jest.fn().mockResolvedValue("event-1"),
      saveEvents: jest.fn(),
      schedulePublishing: jest.fn().mockResolvedValue(undefined),
    };

    unitOfWork = {
      execute: jest.fn().mockImplementation(async (work) => work({})),
    };

    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    handler = new SendNotificationHandler(
      notificationRepo,
      preferenceRepo,
      emailService,
      outboxService,
      unitOfWork,
      logger,
    );
  });

  it("should send email and save notification as sent", async () => {
    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "email",
      "welcome",
      { name: "John" },
    );

    const result = await handler.execute(command);

    expect(result).toBeTruthy(); // returns notificationId
    expect(emailService.send).toHaveBeenCalledWith(
      "welcome",
      "user@example.com",
      "Welcome to AI Interview Platform",
      { name: "John" },
    );
    expect(notificationRepo.save).toHaveBeenCalled();
    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "notification.sent",
      expect.objectContaining({
        channel: "email",
        template: "welcome",
        status: "sent",
      }),
      expect.any(String),
      expect.anything(),
    );
    expect(outboxService.schedulePublishing).toHaveBeenCalledWith(["event-1"]);
  });

  it("should mark in-app notification as sent without calling emailService", async () => {
    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "in_app",
      "invitation",
      {},
    );

    const result = await handler.execute(command);

    expect(result).toBeTruthy();
    expect(emailService.send).not.toHaveBeenCalled();
    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "notification.sent",
      expect.objectContaining({
        channel: "in_app",
        status: "sent",
      }),
      expect.any(String),
      expect.anything(),
    );
  });

  it("should skip sending when email is disabled in preferences", async () => {
    const pref = NotificationPreference.create("user-123");
    pref.toggleEmail(); // disable email
    preferenceRepo.findByUserId.mockResolvedValue(pref);

    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "email",
      "welcome",
      {},
    );

    const result = await handler.execute(command);

    expect(result).toBe("");
    expect(emailService.send).not.toHaveBeenCalled();
    expect(notificationRepo.save).not.toHaveBeenCalled();
  });

  it("should skip sending when in-app is disabled in preferences", async () => {
    const pref = NotificationPreference.create("user-123");
    pref.toggleInApp(); // disable in-app
    preferenceRepo.findByUserId.mockResolvedValue(pref);

    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "in_app",
      "welcome",
      {},
    );

    const result = await handler.execute(command);
    expect(result).toBe("");
    expect(notificationRepo.save).not.toHaveBeenCalled();
  });

  it("should skip sending when user unsubscribed from template type", async () => {
    const pref = NotificationPreference.create("user-123");
    pref.updateSubscription("weekly_digest", false);
    preferenceRepo.findByUserId.mockResolvedValue(pref);

    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "email",
      "weekly_digest",
      {},
    );

    const result = await handler.execute(command);
    expect(result).toBe("");
  });

  it("should mark notification as failed when email service throws", async () => {
    emailService.send.mockRejectedValue(new Error("SMTP connection refused"));

    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "email",
      "welcome",
      {},
    );

    const result = await handler.execute(command);

    // Should NOT throw, handler catches email errors gracefully
    expect(result).toBeTruthy();
    expect(outboxService.saveEvent).toHaveBeenCalledWith(
      "notification.failed",
      expect.objectContaining({
        status: "failed",
      }),
      expect.any(String),
      expect.anything(),
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it("should send email even when no preferences are stored", async () => {
    preferenceRepo.findByUserId.mockResolvedValue(null);

    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "email",
      "welcome",
      {},
    );

    const result = await handler.execute(command);
    expect(result).toBeTruthy();
    expect(emailService.send).toHaveBeenCalled();
  });

  it("should log success after sending", async () => {
    const command = new SendNotificationCommand(
      "user-123",
      "user@example.com",
      "email",
      "welcome",
      {},
    );

    await handler.execute(command);

    expect(logger.commandLog).toHaveBeenCalledWith(
      "SendNotification",
      true,
      expect.objectContaining({
        action: "send_notification",
        channel: "email",
        template: "welcome",
        userId: "user-123",
      }),
    );
  });
});
