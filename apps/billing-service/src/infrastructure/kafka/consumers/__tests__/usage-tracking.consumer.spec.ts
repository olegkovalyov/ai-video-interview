import { UsageTrackingConsumer } from "../usage-tracking.consumer";
import { IncrementUsageCommand } from "../../../../application/commands/increment-usage/increment-usage.command";

describe("UsageTrackingConsumer", () => {
  let consumer: UsageTrackingConsumer;
  let mockCommandBus: { execute: jest.Mock };
  let mockKafkaService: { subscribe: jest.Mock; parseEvent: jest.Mock };
  let mockLogger: Record<string, jest.Mock>;
  let interviewHandler: (message: any) => Promise<void>;
  let analysisHandler: (message: any) => Promise<void>;

  beforeEach(async () => {
    mockCommandBus = { execute: jest.fn().mockResolvedValue(undefined) };

    const handlers: Array<(message: any) => Promise<void>> = [];
    mockKafkaService = {
      subscribe: jest.fn().mockImplementation((_topic, _group, handler) => {
        handlers.push(handler);
      }),
      parseEvent: jest.fn(),
    };
    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    consumer = new UsageTrackingConsumer(
      mockKafkaService as any,
      mockCommandBus as any,
      mockLogger as any,
    );
    await consumer.onModuleInit();

    // First subscribe = interview-events, second = analysis-events
    interviewHandler = handlers[0];
    analysisHandler = handlers[1];
  });

  describe("onModuleInit", () => {
    it("should subscribe to interview-events and analysis-events", () => {
      expect(mockKafkaService.subscribe).toHaveBeenCalledTimes(2);
      expect(mockKafkaService.subscribe).toHaveBeenCalledWith(
        "interview-events",
        "billing-service-interview",
        expect.any(Function),
      );
      expect(mockKafkaService.subscribe).toHaveBeenCalledWith(
        "analysis-events",
        "billing-service-analysis",
        expect.any(Function),
      );
    });
  });

  describe("invitation.completed → increment interviews", () => {
    it("should increment interview usage", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "invitation.completed",
        payload: { companyId: "company-abc" },
      });

      await interviewHandler({} as any);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new IncrementUsageCommand("company-abc", "interviews", 1),
      );
    });

    it("should skip when companyId missing", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "invitation.completed",
        payload: {},
      });

      await interviewHandler({} as any);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        expect.stringContaining("missing companyId"),
      );
    });

    it("should skip non invitation.completed events", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "invitation.started",
        payload: { companyId: "company-abc" },
      });

      await interviewHandler({} as any);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should handle command failure gracefully", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "invitation.completed",
        payload: { companyId: "company-abc" },
      });
      mockCommandBus.execute.mockRejectedValue(new Error("DB error"));

      await interviewHandler({} as any);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to increment interview usage"),
        expect.any(Error),
      );
    });
  });

  describe("analysis.completed → increment analysisTokens", () => {
    it("should increment analysis token usage", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "analysis.completed",
        payload: { companyId: "company-xyz", tokensUsed: 1500 },
      });

      await analysisHandler({} as any);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new IncrementUsageCommand("company-xyz", "analysisTokens", 1500),
      );
    });

    it("should default tokensUsed to 0 when missing", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "analysis.completed",
        payload: { companyId: "company-xyz" },
      });

      await analysisHandler({} as any);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        new IncrementUsageCommand("company-xyz", "analysisTokens", 0),
      );
    });

    it("should skip when companyId missing", async () => {
      mockKafkaService.parseEvent.mockReturnValue({
        eventType: "analysis.completed",
        payload: { tokensUsed: 1500 },
      });

      await analysisHandler({} as any);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });
  });
});
