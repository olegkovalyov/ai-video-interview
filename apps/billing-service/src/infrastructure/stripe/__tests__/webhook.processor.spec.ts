import { WebhookProcessor } from "../webhook.processor";
import { ProcessStripeWebhookCommand } from "../../../application/commands/process-stripe-webhook/process-stripe-webhook.command";

describe("WebhookProcessor", () => {
  let processor: WebhookProcessor;
  let commandBus: any;
  let logger: any;

  beforeEach(() => {
    commandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    };

    logger = {
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      error: jest.fn(),
      commandLog: jest.fn(),
    };

    processor = new WebhookProcessor(commandBus, logger);
  });

  it("should execute ProcessStripeWebhookCommand via commandBus", async () => {
    const job = {
      data: {
        eventId: "evt_123",
        eventType: "checkout.session.completed",
        rawBody: "raw-body-string",
        signature: "sig_abc",
      },
    } as any;

    await processor.handleWebhook(job);

    expect(commandBus.execute).toHaveBeenCalledWith(
      expect.any(ProcessStripeWebhookCommand),
    );
  });

  it("should create command with correct rawBody and signature", async () => {
    const job = {
      data: {
        eventId: "evt_123",
        eventType: "invoice.paid",
        rawBody: "webhook-raw-body",
        signature: "whsec_sig",
      },
    } as any;

    await processor.handleWebhook(job);

    const command = commandBus.execute.mock.calls[0][0];
    expect(command.rawBody).toBe("webhook-raw-body");
    expect(command.signature).toBe("whsec_sig");
  });

  it("should re-throw error for BullMQ retry", async () => {
    commandBus.execute.mockRejectedValue(new Error("Processing failed"));

    const job = {
      data: {
        eventId: "evt_fail",
        eventType: "invoice.payment_failed",
        rawBody: "raw",
        signature: "sig",
      },
    } as any;

    await expect(processor.handleWebhook(job)).rejects.toThrow(
      "Processing failed",
    );
  });

  it("should log info on successful processing", async () => {
    const job = {
      data: {
        eventId: "evt_ok",
        eventType: "checkout.session.completed",
        rawBody: "raw",
        signature: "sig",
      },
    } as any;

    await processor.handleWebhook(job);

    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Processing Stripe webhook"),
      expect.objectContaining({
        action: "webhook.processing",
        eventId: "evt_ok",
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Stripe webhook processed"),
      expect.objectContaining({
        action: "webhook.processed",
        eventId: "evt_ok",
      }),
    );
  });

  it("should log error on failure", async () => {
    commandBus.execute.mockRejectedValue(new Error("Boom"));

    const job = {
      data: {
        eventId: "evt_err",
        eventType: "invoice.paid",
        rawBody: "raw",
        signature: "sig",
      },
    } as any;

    await expect(processor.handleWebhook(job)).rejects.toThrow("Boom");

    expect(logger.error).toHaveBeenCalledWith(
      expect.stringContaining("Stripe webhook processing failed"),
      expect.any(String),
    );
  });
});
