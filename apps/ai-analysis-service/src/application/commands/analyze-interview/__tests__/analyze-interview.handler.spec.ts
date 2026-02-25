import { ConfigService } from '@nestjs/config';
import { AnalyzeInterviewHandler } from '../analyze-interview.handler';
import { AnalyzeInterviewCommand } from '../analyze-interview.command';
import { IAnalysisResultRepository } from '../../../ports';
import { IAnalysisEngine, QuestionAnalysisOutput, SummaryOutput } from '../../../ports/analysis-engine.port';
import { IEventPublisher } from '../../../ports/event-publisher.port';
import { IPromptLoader } from '../../../ports/prompt-loader.port';
import { InvitationCompletedEventData } from '../../../dto/kafka/invitation-completed.event';
import { AnalysisAlreadyExistsException } from '../../../../domain/exceptions/analysis.exceptions';

describe('AnalyzeInterviewHandler', () => {
  let handler: AnalyzeInterviewHandler;
  let mockRepository: jest.Mocked<IAnalysisResultRepository>;
  let mockAnalysisEngine: jest.Mocked<IAnalysisEngine>;
  let mockEventPublisher: jest.Mocked<IEventPublisher>;
  let mockPromptLoader: jest.Mocked<IPromptLoader>;

  const createMockEventData = (overrides?: Partial<InvitationCompletedEventData>): InvitationCompletedEventData => ({
    invitationId: 'inv-123',
    candidateId: 'cand-456',
    templateId: 'tmpl-789',
    templateTitle: 'Senior Developer Interview',
    companyName: 'Tech Corp',
    completedAt: new Date(),
    questions: [
      {
        id: 'q-1',
        text: 'What is dependency injection?',
        type: 'text',
        orderIndex: 0,
      },
      {
        id: 'q-2',
        text: 'Explain SOLID principles',
        type: 'text',
        orderIndex: 1,
      },
    ],
    responses: [
      {
        id: 'r-1',
        questionId: 'q-1',
        textAnswer: 'DI is a design pattern...',
        submittedAt: new Date(),
      },
      {
        id: 'r-2',
        questionId: 'q-2',
        textAnswer: 'SOLID stands for...',
        submittedAt: new Date(),
      },
    ],
    language: 'en',
    ...overrides,
  });

  const mockQuestionAnalysisOutput: QuestionAnalysisOutput = {
    score: 80,
    feedback: 'Good explanation with clear examples.',
    criteriaScores: [
      { criterion: 'relevance', score: 85, weight: 0.25 },
      { criterion: 'completeness', score: 80, weight: 0.25 },
      { criterion: 'clarity', score: 75, weight: 0.25 },
      { criterion: 'depth', score: 80, weight: 0.25 },
    ],
    tokensUsed: 500,
  };

  const mockSummaryOutput: SummaryOutput = {
    summary: 'Strong candidate with solid technical knowledge.',
    strengths: ['Good understanding of design patterns', 'Clear communication'],
    weaknesses: ['Could improve on system design examples'],
    recommendation: 'hire',
    tokensUsed: 300,
  };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn().mockResolvedValue(undefined),
      findById: jest.fn(),
      findByInvitationId: jest.fn(),
      findAll: jest.fn(),
      existsByInvitationId: jest.fn().mockResolvedValue(false),
      delete: jest.fn(),
      saveSourceEventData: jest.fn().mockResolvedValue(undefined),
      getSourceEventData: jest.fn().mockResolvedValue(null),
    };

    mockAnalysisEngine = {
      analyzeResponse: jest.fn().mockResolvedValue(mockQuestionAnalysisOutput),
      generateSummary: jest.fn().mockResolvedValue(mockSummaryOutput),
    };

    mockEventPublisher = {
      publish: jest.fn().mockResolvedValue(undefined),
    };

    mockPromptLoader = {
      getQuestionAnalysisPrompt: jest.fn().mockReturnValue('Analyze this response...'),
      getSummaryPrompt: jest.fn().mockReturnValue('Generate summary...'),
      getCriteria: jest.fn().mockReturnValue([
        { name: 'relevance', weight: 0.25, description: 'How relevant is the answer' },
        { name: 'completeness', weight: 0.25, description: 'How complete is the answer' },
        { name: 'clarity', weight: 0.25, description: 'How clear is the answer' },
        { name: 'depth', weight: 0.25, description: 'How deep is the answer' },
      ]),
      getSystemPrompt: jest.fn().mockReturnValue('You are an AI interviewer...'),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-model'),
    } as unknown as ConfigService;

    handler = new AnalyzeInterviewHandler(
      mockRepository,
      mockAnalysisEngine,
      mockEventPublisher,
      mockPromptLoader,
      mockConfigService,
    );
  });

  describe('execute', () => {
    it('should create analysis and process all questions successfully', async () => {
      const eventData = createMockEventData();
      const command = new AnalyzeInterviewCommand(eventData);

      const result = await handler.execute(command);

      expect(result).toBeDefined();
      expect(result.invitationId).toBe('inv-123');
      expect(result.status).toBe('completed');
      expect(result.recommendation).toBe('hire');
      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      expect(mockAnalysisEngine.analyzeResponse).toHaveBeenCalledTimes(2);
      expect(mockAnalysisEngine.generateSummary).toHaveBeenCalledTimes(1);
    });

    it('should throw AnalysisAlreadyExistsException if analysis exists', async () => {
      mockRepository.existsByInvitationId.mockResolvedValue(true);
      const eventData = createMockEventData();
      const command = new AnalyzeInterviewCommand(eventData);

      await expect(handler.execute(command)).rejects.toThrow(AnalysisAlreadyExistsException);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should publish domain events on success', async () => {
      const eventData = createMockEventData();
      const command = new AnalyzeInterviewCommand(eventData);

      await handler.execute(command);

      expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'analysis.started',
        }),
      );
      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'analysis.completed',
        }),
      );
    });

    it('should fail analysis and throw error on LLM failure', async () => {
      mockAnalysisEngine.analyzeResponse
        .mockResolvedValueOnce(mockQuestionAnalysisOutput)
        .mockRejectedValueOnce(new Error('Rate limit exceeded'));

      const eventData = createMockEventData();
      const command = new AnalyzeInterviewCommand(eventData);

      await expect(handler.execute(command)).rejects.toThrow('Rate limit exceeded');

      expect(mockRepository.save).toHaveBeenCalledTimes(2);
      const lastSaveCall = mockRepository.save.mock.calls[1][0];
      expect(lastSaveCall.status.isFailed).toBe(true);
    });

    it('should publish AnalysisFailedEvent on error', async () => {
      mockAnalysisEngine.analyzeResponse.mockRejectedValue(new Error('API Error'));

      const eventData = createMockEventData();
      const command = new AnalyzeInterviewCommand(eventData);

      await expect(handler.execute(command)).rejects.toThrow('API Error');

      expect(mockEventPublisher.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: 'analysis.failed',
        }),
      );
    });

    it('should skip questions without responses', async () => {
      const eventData = createMockEventData({
        responses: [
          {
            id: 'r-1',
            questionId: 'q-1',
            textAnswer: 'DI is a design pattern...',
            submittedAt: new Date(),
          },
        ],
      });
      const command = new AnalyzeInterviewCommand(eventData);

      await handler.execute(command);

      expect(mockAnalysisEngine.analyzeResponse).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple choice questions correctly', async () => {
      const eventData = createMockEventData({
        questions: [
          {
            id: 'q-mc',
            text: 'What is the capital of France?',
            type: 'multiple_choice',
            orderIndex: 0,
            options: [
              { id: 'opt-1', text: 'London', isCorrect: false },
              { id: 'opt-2', text: 'Paris', isCorrect: true },
              { id: 'opt-3', text: 'Berlin', isCorrect: false },
            ],
          },
        ],
        responses: [
          {
            id: 'r-mc',
            questionId: 'q-mc',
            selectedOptionId: 'opt-2',
            submittedAt: new Date(),
          },
        ],
      });
      const command = new AnalyzeInterviewCommand(eventData);

      await handler.execute(command);

      expect(mockAnalysisEngine.analyzeResponse).toHaveBeenCalledWith(
        expect.objectContaining({
          questionType: 'multiple_choice',
          responseText: 'Paris',
          correctAnswer: 'Paris',
        }),
      );
    });

    it('should calculate total tokens used', async () => {
      const eventData = createMockEventData();
      const command = new AnalyzeInterviewCommand(eventData);

      const result = await handler.execute(command);

      expect(result.metadata.totalTokensUsed).toBe(1300);
    });

    it('should use provided language', async () => {
      const eventData = createMockEventData({ language: 'ru' });
      const command = new AnalyzeInterviewCommand(eventData);

      const result = await handler.execute(command);

      expect(result.metadata.language).toBe('ru');
    });

    it('should default to English if no language provided', async () => {
      const eventData = createMockEventData({ language: undefined });
      const command = new AnalyzeInterviewCommand(eventData);

      const result = await handler.execute(command);

      expect(result.metadata.language).toBe('en');
    });
  });
});
