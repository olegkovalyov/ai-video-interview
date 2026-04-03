// @ts-nocheck
import { CommandBus } from "@nestjs/cqrs";
import { RetryAnalysisHandler } from "../retry-analysis.handler";
import { RetryAnalysisCommand } from "../retry-analysis.command";
import { AnalyzeInterviewCommand } from "../../analyze-interview/analyze-interview.command";
import { IAnalysisResultRepository } from "../../../ports";
import { AnalysisResult } from "../../../../domain/aggregates/analysis-result.aggregate";
import {
  AnalysisNotFoundException,
  InvalidStatusTransitionException,
} from "../../../../domain/exceptions/analysis.exceptions";
import { AnalysisResultResponse } from "../../../dto/responses/analysis-result.response";

describe("RetryAnalysisHandler", () => {
  let handler: RetryAnalysisHandler;
  let mockRepository: jest.Mocked<IAnalysisResultRepository>;
  let mockCommandBus: jest.Mocked<CommandBus>;

  const createFailedAnalysis = (): AnalysisResult => {
    const analysis = AnalysisResult.create(
      {
        invitationId: "inv-123",
        candidateId: "cand-456",
        templateId: "tmpl-789",
        templateTitle: "Developer Interview",
        companyName: "Tech Corp",
      },
      "analysis-123",
    );
    analysis.start();
    analysis.fail("Rate limit exceeded");
    return analysis;
  };

  const createCompletedAnalysis = (): AnalysisResult => {
    const analysis = AnalysisResult.create(
      {
        invitationId: "inv-123",
        candidateId: "cand-456",
        templateId: "tmpl-789",
        templateTitle: "Developer Interview",
        companyName: "Tech Corp",
      },
      "analysis-456",
    );
    return analysis;
  };

  const mockSourceEventData: Record<string, unknown> = {
    invitationId: "inv-123",
    candidateId: "cand-456",
    templateId: "tmpl-789",
    templateTitle: "Developer Interview",
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
        submittedAt: "2026-03-01T12:05:00.000Z",
      },
    ],
    language: "en",
  };

  const mockAnalysisResponse: AnalysisResultResponse = {
    id: "analysis-new",
    invitationId: "inv-123",
    candidateId: "cand-456",
    templateId: "tmpl-789",
    templateTitle: "Developer Interview",
    companyName: "Tech Corp",
    status: "completed",
    overallScore: 80,
    overallScoreGrade: "B",
    summary: "Strong candidate",
    strengths: ["Good understanding"],
    weaknesses: ["Could improve examples"],
    recommendation: "hire",
    recommendationLabel: "Hire",
    metadata: {
      modelUsed: "test-model",
      totalTokensUsed: 1000,
      processingTimeMs: 5000,
      processingTimeSeconds: 5,
      questionsAnalyzed: 1,
      averageTokensPerQuestion: 1000,
      language: "en",
    },
    errorMessage: null,
    questionsCount: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: new Date(),
  };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByInvitationId: jest.fn(),
      findAll: jest.fn(),
      existsByInvitationId: jest.fn(),
      delete: jest.fn().mockResolvedValue(undefined),
      saveSourceEventData: jest.fn().mockResolvedValue(undefined),
      getSourceEventData: jest.fn(),
    };

    mockCommandBus = {
      execute: jest.fn().mockResolvedValue(mockAnalysisResponse),
    } as unknown as jest.Mocked<CommandBus>;

    handler = new RetryAnalysisHandler(mockRepository, mockCommandBus);
  });

  describe("execute", () => {
    it("should retry failed analysis successfully", async () => {
      const failedAnalysis = createFailedAnalysis();
      mockRepository.findById.mockResolvedValue(failedAnalysis);
      mockRepository.getSourceEventData.mockResolvedValue(mockSourceEventData);

      const command = new RetryAnalysisCommand("analysis-123");
      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.status).toBe("completed");
      expect(mockRepository.findById).toHaveBeenCalledWith("analysis-123");
      expect(mockRepository.getSourceEventData).toHaveBeenCalledWith(
        "analysis-123",
      );
      expect(mockRepository.delete).toHaveBeenCalledWith("analysis-123");
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });

    it("should throw AnalysisNotFoundException when analysis not found", async () => {
      mockRepository.findById.mockResolvedValue(null);

      const command = new RetryAnalysisCommand("non-existent");

      await expect(handler.execute(command)).rejects.toThrow(
        AnalysisNotFoundException,
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should throw InvalidStatusTransitionException when analysis is not in failed status", async () => {
      const pendingAnalysis = createCompletedAnalysis();
      mockRepository.findById.mockResolvedValue(pendingAnalysis);

      const command = new RetryAnalysisCommand("analysis-456");

      await expect(handler.execute(command)).rejects.toThrow(
        InvalidStatusTransitionException,
      );
      expect(mockRepository.getSourceEventData).not.toHaveBeenCalled();
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should throw AnalysisNotFoundException when source event data is not available", async () => {
      const failedAnalysis = createFailedAnalysis();
      mockRepository.findById.mockResolvedValue(failedAnalysis);
      mockRepository.getSourceEventData.mockResolvedValue(null);

      const command = new RetryAnalysisCommand("analysis-123");

      await expect(handler.execute(command)).rejects.toThrow(
        AnalysisNotFoundException,
      );
      await expect(handler.execute(command)).rejects.toThrow(
        "source event data not available",
      );
      expect(mockRepository.delete).not.toHaveBeenCalled();
      expect(mockCommandBus.execute).not.toHaveBeenCalled();
    });

    it("should execute AnalyzeInterviewCommand with correct event data", async () => {
      const failedAnalysis = createFailedAnalysis();
      mockRepository.findById.mockResolvedValue(failedAnalysis);
      mockRepository.getSourceEventData.mockResolvedValue(mockSourceEventData);

      const command = new RetryAnalysisCommand("analysis-123");
      await handler.execute(command);

      const executeCall = mockCommandBus.execute.mock.calls[0][0];
      expect(executeCall).toBeInstanceOf(AnalyzeInterviewCommand);
      expect(executeCall.eventData.invitationId).toBe("inv-123");
      expect(executeCall.eventData.candidateId).toBe("cand-456");
      expect(executeCall.eventData.templateId).toBe("tmpl-789");
    });

    it("should delete failed analysis before re-executing", async () => {
      const failedAnalysis = createFailedAnalysis();
      mockRepository.findById.mockResolvedValue(failedAnalysis);
      mockRepository.getSourceEventData.mockResolvedValue(mockSourceEventData);

      const callOrder: string[] = [];
      mockRepository.delete.mockImplementation(async () => {
        callOrder.push("delete");
      });
      mockCommandBus.execute.mockImplementation(async () => {
        callOrder.push("execute");
        return mockAnalysisResponse;
      });

      const command = new RetryAnalysisCommand("analysis-123");
      await handler.execute(command);

      expect(callOrder).toEqual(["delete", "execute"]);
    });
  });
});
