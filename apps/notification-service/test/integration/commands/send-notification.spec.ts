import { DataSource } from "typeorm";
import { INestApplication } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { SendNotificationCommand } from "../../../src/application/commands/send-notification/send-notification.command";
import { NotificationEntity } from "../../../src/infrastructure/persistence/entities/notification.entity";
import {
  createTestDataSource,
  cleanDatabase,
  seedPreference,
  setupTestApp,
} from "../setup";
import {
  mockEmailService,
  mockOutboxService,
} from "../test-application.module";

describe("SendNotification (Integration)", () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let commandBus: CommandBus;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    app = await setupTestApp(dataSource);
    commandBus = app.get(CommandBus);
  });

  afterAll(async () => {
    await app?.close();
    if (dataSource?.isInitialized) {
      await dataSource.destroy();
    }
  });

  beforeEach(async () => {
    await cleanDatabase(dataSource);
    jest.clearAllMocks();
  });

  it("should save email notification to DB with status=sent", async () => {
    const notificationId = await commandBus.execute(
      new SendNotificationCommand(
        "00000000-0000-0000-0000-000000000001",
        "user@example.com",
        "email",
        "welcome",
        { name: "John" },
      ),
    );

    expect(notificationId).toBeTruthy();

    const repo = dataSource.getRepository(NotificationEntity);
    const saved = await repo.findOneBy({ id: notificationId });

    expect(saved).toBeTruthy();
    expect(saved!.status).toBe("sent");
    expect(saved!.channel).toBe("email");
    expect(saved!.template).toBe("welcome");
    expect(saved!.recipientEmail).toBe("user@example.com");
    expect(mockEmailService.send).toHaveBeenCalled();
  });

  it("should save in-app notification to DB with status=sent", async () => {
    const notificationId = await commandBus.execute(
      new SendNotificationCommand(
        "00000000-0000-0000-0000-000000000001",
        "user@example.com",
        "in_app",
        "invitation",
        { interviewTitle: "Backend Dev" },
      ),
    );

    const repo = dataSource.getRepository(NotificationEntity);
    const saved = await repo.findOneBy({ id: notificationId });

    expect(saved).toBeTruthy();
    expect(saved!.status).toBe("sent");
    expect(saved!.channel).toBe("in_app");
    expect(mockEmailService.send).not.toHaveBeenCalled();
  });

  it("should not send email when preference disables email", async () => {
    const userId = "00000000-0000-0000-0000-000000000002";
    await seedPreference(dataSource, {
      userId,
      emailEnabled: false,
    });

    const result = await commandBus.execute(
      new SendNotificationCommand(
        userId,
        "user2@example.com",
        "email",
        "welcome",
        {},
      ),
    );

    expect(result).toBe("");
    expect(mockEmailService.send).not.toHaveBeenCalled();

    // Verify nothing was saved to DB
    const repo = dataSource.getRepository(NotificationEntity);
    const count = await repo.count({ where: { recipientId: userId } });
    expect(count).toBe(0);
  });

  it("should save multiple notifications for same recipient", async () => {
    const userId = "00000000-0000-0000-0000-000000000003";

    await commandBus.execute(
      new SendNotificationCommand(
        userId,
        "user3@example.com",
        "email",
        "welcome",
        {},
      ),
    );

    await commandBus.execute(
      new SendNotificationCommand(
        userId,
        "user3@example.com",
        "in_app",
        "invitation",
        {},
      ),
    );

    const repo = dataSource.getRepository(NotificationEntity);
    const notifications = await repo.find({
      where: { recipientId: userId },
      order: { createdAt: "ASC" },
    });

    expect(notifications).toHaveLength(2);
    expect(notifications[0].channel).toBe("email");
    expect(notifications[1].channel).toBe("in_app");
  });

  it("should save failed notification when email service throws", async () => {
    mockEmailService.send.mockRejectedValueOnce(
      new Error("SMTP connection refused"),
    );

    const notificationId = await commandBus.execute(
      new SendNotificationCommand(
        "00000000-0000-0000-0000-000000000004",
        "fail@example.com",
        "email",
        "welcome",
        {},
      ),
    );

    const repo = dataSource.getRepository(NotificationEntity);
    const saved = await repo.findOneBy({ id: notificationId });

    expect(saved).toBeTruthy();
    expect(saved!.status).toBe("failed");
    expect(saved!.error).toBe("SMTP connection refused");
    expect(saved!.retryCount).toBe(1);
    expect(mockOutboxService.saveEvent).toHaveBeenCalledWith(
      "notification.failed",
      expect.anything(),
      expect.any(String),
      expect.anything(),
    );
  });
});
