// @ts-nocheck
import { Test, TestingModule } from "@nestjs/testing";
import { CommandBus } from "@nestjs/cqrs";
import { getRepositoryToken } from "@nestjs/typeorm";
import { InvitationCompletedConsumer } from "../invitation-completed.consumer";
import { AnalyzeInterviewCommand } from "../../../../application/commands/analyze-interview/analyze-interview.command";
import { AnalysisAlreadyExistsException } from "../../../../domain/exceptions/analysis.exceptions";
import { AnalysisResultEntity } from "../../../persistence/entities/analysis-result.entity";
import { ProcessedEventEntity } from "../../../persistence/entities/processed-event.entity";

describe("InvitationCompletedConsumer", () => {
  let consumer: InvitationCompletedConsumer;
  let mockCommandBus: jest.Mocked<CommandBus>;
  let mockAnalysisResultRepo: Record<string, jest.Mock>;
  let mockProcessedEventRepo: Record<string, jest.Mock>;
  let mockKafkaService: Record<string, jest.Mock>;
  let subscribedHandler: (message: any) => Promise<void>;

  const createValidKafkaMessage = (overrides?: Record<string, unknown>) => {
    const event = {
      eventId: "evt-001",
      eventType: "invitation.completed",
      timestamp: "2026-03-01T12:00:00.000Z",
      version: 1,
      payload: {
        invitationId: "inv-123",
        candidateId: "cand-456",
        templateId: "tmpl-789",
        templateTitle: "Senior Developer Interview",
        companyName: "Tech Corp",
        completedAt: "2026-03-01T12:00:00.000Z",
        questions: [
          {
            id: "q-1",
            text: "What is dependency injection?",
            type: "text",
            orderIndex: 0,
          },
        ],
        responses: [
          {
            id: "r-1",
            questionId: "q-1",
            textAnswer: "DI is a design pattern...",
          },
        ],
        language: "en",
      },
      ...overrides,
    };

    return {
      value: Buffer.from(JSON.stringify(event)),
      headers: { "x-correlation-id": Buffer.from("corr-123") },
    };
  };

  beforeEach(async () => {
    mockCommandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;

    mockAnalysisResultRepo = {
      findOne: jest.fn().mockResolvedValue(null),
    };

    mockProcessedEventRepo = {
      findOne: jest.fn().mockResolvedValue(null),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockKafkaService = {
      subscribe: jest
        .fn()
        .mockImplementation(async (_topic, _group, handler) => {
          subscribedHandler = handler;
        }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvitationCompletedConsumer,
        { provide: CommandBus, useValue: mockCommandBus },
        { provide: "KAFKA_SERVICE", useValue: mockKafkaService },
        {
          provide: getRepositoryToken(AnalysisResultEntity),
          useValue: mockAnalysisResultRepo,
        },
        {
          provide: getRepositoryToken(ProcessedEventEntity),
          useValue: mockProcessedEventRepo,
        },
      ],
    }).compile();

    consumer = module.get<InvitationCompletedConsumer>(
      InvitationCompletedConsumer,
    );
    await consumer.onModuleInit();
  });

  describe("onModuleInit", () => {
    it("should subscribe to interview-events topic", () => {
      expect(mockKafkaService.subscribe).toHaveBeenCalledWith(
        "interview-events",
        "ai-analysis-service-invitation-consumer",
        expect.any(Function),
        { fromBeginning: true, autoCommit: true, sessionTimeout: 600000 },
      );
    });
  });

  describe("message processing", () => {
    it("should successfully process a valid invitation.completed event", async () => {
      const message = createValidKafkaMessage();

      await subscribedHandler(message);

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const executedCommand = mockCommandBus.execute.mock.calls[0][0];
      expect(executedCommand).toBeInstanceOf(AnalyzeInterviewCommand);
      expect(executedCommand.eventData.invitationId).toBe("inv-123");
      expect(executedCommand.eventData.candidateId).toBe("cand-456");
      expect(executedCommand.eventData.templateId).toBe("tmpl-789");
      expect(executedCommand.eventData.templateTitle).toBe(
        "Senior Developer Interview",
      );
      expect(executedCommand.eventData.companyName).toBe("Tech Corp");
    });

    it("should skip already processed events (idempotency)", async () => {
      mockProcessedEventRepo.findOne.mockResolvedValue({
        eventId: "evt-001",
        serviceName: "ai-analysis-service",
        processedAt: new Date(),
      });

      const message = createValidKafkaMessage();
      await subscribedHandler(message);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
      expect(mockProcessedEventRepo.save).not.toHaveBeenCalled();
    });

    it("should skip if analysis already exists for invitationId", async () => {
      mockAnalysisResultRepo.findOne.mockResolvedValue({
        id: "existing-analysis",
        invitationId: "inv-123",
        status: "completed",
      });

      const message = createValidKafkaMessage();
      await subscribedHandler(message);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should delegate to CommandBus with AnalyzeInterviewCommand", async () => {
      const message = createValidKafkaMessage();

      await subscribedHandler(message);

      expect(mockCommandBus.execute).toHaveBeenCalledWith(
        expect.any(AnalyzeInterviewCommand),
      );
      const command = mockCommandBus.execute.mock
        .calls[0][0] as AnalyzeInterviewCommand;
      expect(command.eventData.questions).toHaveLength(1);
      expect(command.eventData.questions[0].text).toBe(
        "What is dependency injection?",
      );
      expect(command.eventData.responses).toHaveLength(1);
      expect(command.eventData.responses[0].textAnswer).toBe(
        "DI is a design pattern...",
      );
    });

    it("should mark event as processed after success", async () => {
      const message = createValidKafkaMessage();

      await subscribedHandler(message);

      expect(mockProcessedEventRepo.save).toHaveBeenCalledTimes(1);
      const savedEntity = mockProcessedEventRepo.save.mock.calls[0][0];
      expect(savedEntity.eventId).toBe("evt-001");
      expect(savedEntity.serviceName).toBe("ai-analysis-service");
    });

    it("should handle AnalysisAlreadyExistsException as idempotent success", async () => {
      mockCommandBus.execute.mockRejectedValue(
        new AnalysisAlreadyExistsException("inv-123"),
      );

      const message = createValidKafkaMessage();

      await expect(subscribedHandler(message)).resolves.not.toThrow();
      expect(mockProcessedEventRepo.save).toHaveBeenCalledTimes(1);
    });

    it("should handle null message value gracefully", async () => {
      const message = { value: null, headers: {} };

      await expect(subscribedHandler(message)).resolves.not.toThrow();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should reject on malformed JSON message", async () => {
      const message = {
        value: Buffer.from("not-valid-json"),
        headers: {},
      };

      await expect(subscribedHandler(message)).rejects.toThrow();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should ignore non invitation.completed event types", async () => {
      const message = createValidKafkaMessage({
        eventType: "invitation.created",
      });

      await subscribedHandler(message);

      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should handle unique constraint violation when marking event as processed", async () => {
      const uniqueError = new Error("duplicate key value") as any;
      uniqueError.code = "23505";
      mockProcessedEventRepo.save.mockRejectedValue(uniqueError);

      const message = createValidKafkaMessage();

      await expect(subscribedHandler(message)).resolves.not.toThrow();
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });

    it("should propagate non-duplicate errors when marking event as processed", async () => {
      mockProcessedEventRepo.save.mockRejectedValue(
        new Error("Connection lost"),
      );

      const message = createValidKafkaMessage();

      await expect(subscribedHandler(message)).rejects.toThrow(
        "Connection lost",
      );
    });

    it("should pass language from event payload to command", async () => {
      const message = createValidKafkaMessage();
      // Override the event to have language 'ru'
      const event = JSON.parse(message.value.toString());
      event.payload.language = "ru";
      message.value = Buffer.from(JSON.stringify(event));

      await subscribedHandler(message);

      const command = mockCommandBus.execute.mock
        .calls[0][0] as AnalyzeInterviewCommand;
      expect(command.eventData.language).toBe("ru");
    });
  });
});
