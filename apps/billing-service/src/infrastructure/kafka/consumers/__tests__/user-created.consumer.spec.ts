import { UserCreatedConsumer } from "../user-created.consumer";
import { CreateFreeSubscriptionCommand } from "../../../../application/commands/create-free-subscription/create-free-subscription.command";

describe("UserCreatedConsumer", () => {
  let consumer: UserCreatedConsumer;
  let mockCommandBus: { execute: jest.Mock };
  let mockKafkaService: { subscribe: jest.Mock; parseEvent: jest.Mock };
  let mockLogger: Record<string, jest.Mock>;
  let subscribedHandler: (message: any) => Promise<void>;

  beforeEach(async () => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };
    mockKafkaService = {
      subscribe: jest.fn().mockImplementation((_topic, _group, handler) => {
        subscribedHandler = handler;
      }),
      parseEvent: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    consumer = new UserCreatedConsumer(
      mockKafkaService as any,
      mockCommandBus as any,
      mockLogger as any,
    );
    await consumer.onModuleInit();
  });

  describe("onModuleInit", () => {
    it("should subscribe to user-events topic", () => {
      expect(mockKafkaService.subscribe).toHaveBeenCalledWith(
        "user-events",
        "billing-service-user",
        expect.any(Function),
      );
    });
  });

  describe("message processing", () => {
    it("should create free subscription on user.created event", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "user.created",
        payload: { companyId: "company-123", userId: "user-123" },
      });

      await subscribedHandler({} as any);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CreateFreeSubscriptionCommand("company-123"),
      );
    });

    it("should use userId as fallback when companyId missing", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "user.created",
        payload: { userId: "user-456" },
      });

      await subscribedHandler({} as any);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new CreateFreeSubscriptionCommand("user-456"),
      );
    });

    it("should skip when both companyId and userId missing", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "user.created",
        payload: {},
      });

      await subscribedHandler({} as any);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("missing companyId and userId"),
      );
    });

    it("should skip non user.created events", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "user.updated",
        payload: { userId: "user-123" },
      });

      await subscribedHandler({} as any);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should skip when parseEvent returns null", async () => {
      mockKafkaService.parseEvent.mockReturnValue(null);

      await subscribedHandler({} as any);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should log error when command execution fails", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "user.created",
        payload: { companyId: "company-123" },
      });
      mockCommandBus.execute.mockRejectedValue(new Error("DB error"));

      await subscribedHandler({} as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create free subscription"),
        expect.any(Error),
      );
    });
  });
});
