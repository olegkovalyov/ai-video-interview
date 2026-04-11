import { Module } from "@nestjs/common";
import { CqrsModule } from "@nestjs/cqrs";
import { DatabaseModule } from "src/infrastructure/persistence/database.module";
import {
  ANALYSIS_ENGINE,
  type IAnalysisEngine,
  type QuestionAnalysisInput,
  type QuestionAnalysisOutput,
  type SummaryInput,
  type SummaryOutput,
} from "src/application/ports/analysis-engine.port";
import {
  EVENT_PUBLISHER,
  type IEventPublisher,
} from "src/application/ports/event-publisher.port";
import {
  PROMPT_LOADER,
  type IPromptLoader,
} from "src/application/ports/prompt-loader.port";
import { AnalyzeInterviewHandler } from "src/application/commands/analyze-interview/analyze-interview.handler";
import { RetryAnalysisHandler } from "src/application/commands/retry-analysis/retry-analysis.handler";
import { GetAnalysisResultHandler } from "src/application/queries/get-analysis-result/get-analysis-result.handler";
import { GetAnalysisByInvitationHandler } from "src/application/queries/get-analysis-by-invitation/get-analysis-by-invitation.handler";
import { ListAnalysesHandler } from "src/application/queries/list-analyses/list-analyses.handler";
import { AnalysisResultMapper } from "src/application/mappers/analysis-result.mapper";
import { ConfigService } from "@nestjs/config";

// ─── Mock Analysis Engine (deterministic scores) ─────

export class MockAnalysisEngine implements IAnalysisEngine {
  async analyzeResponse(
    input: QuestionAnalysisInput,
  ): Promise<QuestionAnalysisOutput> {
    return {
      score: 80,
      feedback: `Good answer to: ${input.questionText.substring(0, 50)}`,
      criteriaScores: [
        { criterion: "relevance", score: 85, weight: 0.25 },
        { criterion: "completeness", score: 75, weight: 0.25 },
        { criterion: "clarity", score: 80, weight: 0.25 },
        { criterion: "depth", score: 80, weight: 0.25 },
      ],
      tokensUsed: 500,
    };
  }

  async generateSummary(input: SummaryInput): Promise<SummaryOutput> {
    const avgScore =
      input.questionAnalyses.reduce((sum, qa) => sum + qa.score, 0) /
      input.questionAnalyses.length;

    return {
      summary: `Analysis of ${input.questionAnalyses.length} questions for ${input.templateTitle}.`,
      strengths: ["Technical knowledge", "Problem solving"],
      weaknesses: ["Could improve depth"],
      recommendation:
        avgScore >= 75 ? "hire" : avgScore >= 50 ? "consider" : "reject",
      tokensUsed: 800,
    };
  }
}

// ─── Mock Event Publisher ────────────────────────────

export const mockEventPublisher: IEventPublisher = {
  publish: jest.fn().mockResolvedValue(undefined),
};

// ─── Mock Prompt Loader ──────────────────────────────

export const mockPromptLoader: IPromptLoader = {
  getQuestionAnalysisPrompt: jest
    .fn()
    .mockReturnValue("Analyze this response..."),
  getSummaryPrompt: jest.fn().mockReturnValue("Generate summary..."),
  getCriteria: jest.fn().mockReturnValue([
    {
      name: "relevance",
      weight: 0.25,
      description: "How relevant is the answer",
    },
    {
      name: "completeness",
      weight: 0.25,
      description: "Coverage of key points",
    },
    { name: "clarity", weight: 0.25, description: "Communication quality" },
    { name: "depth", weight: 0.25, description: "Level of insight" },
  ]),
  getSystemPrompt: jest
    .fn()
    .mockReturnValue("You are an interview analysis AI."),
};

// ─── Mock Outbox Service ─────────────────────────────

export const mockOutboxService = {
  saveEvent: jest.fn().mockResolvedValue("mock-event-id"),
  schedulePublishing: jest.fn().mockResolvedValue(undefined),
};

// ─── Mock MetricsService ─────────────────────────────

export const mockMetricsService = {
  recordAnalysisStarted: jest.fn(),
  recordAnalysisCompleted: jest.fn(),
  recordAnalysisFailed: jest.fn(),
  recordTokenUsage: jest.fn(),
  recordAnalysisDuration: jest.fn(),
  recordLlmCall: jest.fn(),
};

// ─── Test Application Module ─────────────────────────

const CommandHandlers = [AnalyzeInterviewHandler, RetryAnalysisHandler];
const QueryHandlers = [
  GetAnalysisResultHandler,
  GetAnalysisByInvitationHandler,
  ListAnalysesHandler,
];

@Module({
  imports: [CqrsModule, DatabaseModule],
  providers: [
    ...CommandHandlers,
    ...QueryHandlers,
    AnalysisResultMapper,
    {
      provide: ConfigService,
      useValue: { get: (key: string, def?: any) => def },
    },
    { provide: ANALYSIS_ENGINE, useClass: MockAnalysisEngine },
    { provide: EVENT_PUBLISHER, useValue: mockEventPublisher },
    { provide: PROMPT_LOADER, useValue: mockPromptLoader },
    { provide: "IOutboxService", useValue: mockOutboxService },
    { provide: "MetricsService", useValue: mockMetricsService },
  ],
  exports: [CqrsModule],
})
export class TestApplicationModule {}
