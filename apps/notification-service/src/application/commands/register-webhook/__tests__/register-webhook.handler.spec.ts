import { RegisterWebhookHandler } from "../register-webhook.handler";
import { RegisterWebhookCommand } from "../register-webhook.command";
import type { IWebhookEndpointRepository } from "../../../../domain/repositories/webhook-endpoint.repository.interface";

describe("RegisterWebhookHandler", () => {
  let handler: RegisterWebhookHandler;
  let webhookRepo: jest.Mocked<IWebhookEndpointRepository>;
  let logger: any;

  beforeEach(() => {
    webhookRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCompanyId: jest.fn(),
      findActiveByEventType: jest.fn(),
      delete: jest.fn(),
    };

    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    handler = new RegisterWebhookHandler(webhookRepo, logger);
  });

  it("should create webhook endpoint and save to repository", async () => {
    const command = new RegisterWebhookCommand(
      "company-123",
      "https://example.com/webhook",
      ["notification.sent", "analysis.completed"],
    );

    const result = await handler.execute(command);

    expect(result).toBeTruthy(); // returns webhookId (uuid)
    expect(webhookRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        companyId: "company-123",
        url: "https://example.com/webhook",
      }),
    );
  });

  it("should generate a unique secret for the endpoint", async () => {
    const command = new RegisterWebhookCommand(
      "company-123",
      "https://example.com/webhook",
      ["notification.sent"],
    );

    await handler.execute(command);

    const savedEndpoint = webhookRepo.save.mock.calls[0][0];
    expect(savedEndpoint.secret).toBeTruthy();
    expect(savedEndpoint.secret.length).toBe(64); // 32 bytes hex
  });

  it("should return the generated webhook ID", async () => {
    const command = new RegisterWebhookCommand(
      "company-123",
      "https://example.com/webhook",
      ["notification.sent"],
    );

    const webhookId = await handler.execute(command);
    expect(typeof webhookId).toBe("string");
    expect(webhookId.length).toBeGreaterThan(0);
  });

  it("should log success after registration", async () => {
    const command = new RegisterWebhookCommand(
      "company-123",
      "https://example.com/webhook",
      ["notification.sent"],
    );

    await handler.execute(command);

    expect(logger.commandLog).toHaveBeenCalledWith(
      "RegisterWebhook",
      true,
      expect.objectContaining({
        action: "register_webhook",
        companyId: "company-123",
      }),
    );
  });

  it("should create endpoint with correct events list", async () => {
    const events = ["notification.sent", "notification.failed"];
    const command = new RegisterWebhookCommand(
      "company-123",
      "https://example.com/webhook",
      events,
    );

    await handler.execute(command);

    const savedEndpoint = webhookRepo.save.mock.calls[0][0];
    expect(savedEndpoint.events).toEqual(events);
  });
});
