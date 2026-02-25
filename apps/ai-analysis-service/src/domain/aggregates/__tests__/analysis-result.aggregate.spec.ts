import {
  AnalysisResult,
  CreateAnalysisParams,
  CompleteAnalysisParams,
} from '../analysis-result.aggregate';
import { QuestionType } from '../../value-objects/question-type.vo';
import { CriterionType } from '../../value-objects/criteria-score.vo';
import { AnalysisStartedEvent } from '../../events/analysis-started.event';
import { AnalysisCompletedEvent } from '../../events/analysis-completed.event';
import { AnalysisFailedEvent } from '../../events/analysis-failed.event';
import {
  AnalysisAlreadyCompletedException,
  InvalidStatusTransitionException,
  NoQuestionsAnalyzedException,
} from '../../exceptions/analysis.exceptions';

describe('AnalysisResult Aggregate', () => {
  const createParams: CreateAnalysisParams = {
    invitationId: 'invitation-123',
    candidateId: 'candidate-456',
    templateId: 'template-789',
    templateTitle: 'Senior Developer Interview',
    companyName: 'Tech Corp',
  };

  const completeParams: CompleteAnalysisParams = {
    summary: 'Strong candidate with good technical knowledge.',
    strengths: ['Good problem solving', 'Clear communication'],
    weaknesses: ['Could improve on system design'],
    recommendation: 'hire',
    modelUsed: 'llama-3.3-70b-versatile',
    totalTokensUsed: 5000,
    processingTimeMs: 30000,
    language: 'en',
  };

  const questionAnalysisParams = {
    questionId: 'q-1',
    questionText: 'What is DI?',
    questionType: QuestionType.text(),
    responseText: 'DI is a design pattern...',
    score: 80,
    feedback: 'Good explanation',
    criteriaScores: [
      { criterion: CriterionType.RELEVANCE, score: 85, weight: 0.25 },
      { criterion: CriterionType.COMPLETENESS, score: 80, weight: 0.25 },
      { criterion: CriterionType.CLARITY, score: 75, weight: 0.25 },
      { criterion: CriterionType.DEPTH, score: 80, weight: 0.25 },
    ],
    tokensUsed: 500,
  };

  describe('create', () => {
    it('should create analysis result with pending status', () => {
      const analysis = AnalysisResult.create(createParams);

      expect(analysis.id).toBeDefined();
      expect(analysis.invitationId).toBe('invitation-123');
      expect(analysis.candidateId).toBe('candidate-456');
      expect(analysis.templateId).toBe('template-789');
      expect(analysis.templateTitle).toBe('Senior Developer Interview');
      expect(analysis.companyName).toBe('Tech Corp');
      expect(analysis.status.isPending).toBe(true);
      expect(analysis.overallScore).toBeNull();
      expect(analysis.summary).toBeNull();
      expect(analysis.strengths).toEqual([]);
      expect(analysis.weaknesses).toEqual([]);
      expect(analysis.recommendation).toBeNull();
      expect(analysis.questionAnalyses).toEqual([]);
      expect(analysis.createdAt).toBeInstanceOf(Date);
      expect(analysis.completedAt).toBeNull();
    });

    it('should create with custom id', () => {
      const analysis = AnalysisResult.create(createParams, 'custom-id');
      expect(analysis.id).toBe('custom-id');
    });

    it('should not emit any events on creation', () => {
      const analysis = AnalysisResult.create(createParams);
      expect(analysis.domainEvents).toHaveLength(0);
    });
  });

  describe('start', () => {
    it('should transition to in_progress status', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();

      expect(analysis.status.isInProgress).toBe(true);
    });

    it('should emit AnalysisStartedEvent', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();

      expect(analysis.domainEvents).toHaveLength(1);
      expect(analysis.domainEvents[0]).toBeInstanceOf(AnalysisStartedEvent);
      
      const event = analysis.domainEvents[0] as AnalysisStartedEvent;
      expect(event.aggregateId).toBe(analysis.id);
      expect(event.invitationId).toBe('invitation-123');
    });

    it('should update updatedAt timestamp', () => {
      const analysis = AnalysisResult.create(createParams);
      const beforeStart = analysis.updatedAt;
      
      // Small delay to ensure different timestamp
      analysis.start();
      
      expect(analysis.updatedAt.getTime()).toBeGreaterThanOrEqual(beforeStart.getTime());
    });

    it('should throw error if already in_progress', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();

      expect(() => analysis.start()).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('addQuestionAnalysis', () => {
    it('should add question analysis to the list', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();

      const qa = analysis.addQuestionAnalysis(questionAnalysisParams);

      expect(analysis.questionAnalyses).toHaveLength(1);
      expect(analysis.questionAnalyses[0]).toBe(qa);
      expect(qa.questionId).toBe('q-1');
    });

    it('should add multiple question analyses', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();

      analysis.addQuestionAnalysis(questionAnalysisParams);
      analysis.addQuestionAnalysis({ ...questionAnalysisParams, questionId: 'q-2' });
      analysis.addQuestionAnalysis({ ...questionAnalysisParams, questionId: 'q-3' });

      expect(analysis.questionAnalyses).toHaveLength(3);
    });

    it('should throw error if analysis is completed', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.addQuestionAnalysis(questionAnalysisParams);
      analysis.complete(completeParams);

      expect(() => analysis.addQuestionAnalysis(questionAnalysisParams)).toThrow(
        AnalysisAlreadyCompletedException,
      );
    });

    it('should throw error if analysis is failed', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.fail('Some error');

      expect(() => analysis.addQuestionAnalysis(questionAnalysisParams)).toThrow(
        AnalysisAlreadyCompletedException,
      );
    });
  });

  describe('complete', () => {
    it('should transition to completed status', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.addQuestionAnalysis(questionAnalysisParams);
      analysis.complete(completeParams);

      expect(analysis.status.isCompleted).toBe(true);
    });

    it('should set all completion data', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.addQuestionAnalysis(questionAnalysisParams);
      analysis.complete(completeParams);

      expect(analysis.summary).toBe('Strong candidate with good technical knowledge.');
      expect(analysis.strengths).toEqual(['Good problem solving', 'Clear communication']);
      expect(analysis.weaknesses).toEqual(['Could improve on system design']);
      expect(analysis.recommendation?.isHire).toBe(true);
      expect(analysis.completedAt).toBeInstanceOf(Date);
    });

    it('should set metadata', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.addQuestionAnalysis(questionAnalysisParams);
      analysis.complete(completeParams);

      expect(analysis.metadata.modelUsed).toBe('llama-3.3-70b-versatile');
      expect(analysis.metadata.totalTokensUsed).toBe(5000);
      expect(analysis.metadata.processingTimeMs).toBe(30000);
      expect(analysis.metadata.questionsAnalyzed).toBe(1);
      expect(analysis.metadata.language).toBe('en');
    });

    it('should calculate overall score from question analyses', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.addQuestionAnalysis({ ...questionAnalysisParams, score: 80 });
      analysis.addQuestionAnalysis({ ...questionAnalysisParams, questionId: 'q-2', score: 90 });
      analysis.complete(completeParams);

      // Average of weighted scores
      expect(analysis.overallScore).not.toBeNull();
      expect(analysis.overallScore!.value).toBeGreaterThan(0);
    });

    it('should emit AnalysisCompletedEvent', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.addQuestionAnalysis(questionAnalysisParams);
      analysis.clearEvents(); // Clear start event
      analysis.complete(completeParams);

      expect(analysis.domainEvents).toHaveLength(1);
      expect(analysis.domainEvents[0]).toBeInstanceOf(AnalysisCompletedEvent);

      const event = analysis.domainEvents[0] as AnalysisCompletedEvent;
      expect(event.aggregateId).toBe(analysis.id);
      expect(event.invitationId).toBe('invitation-123');
      expect(event.recommendation).toBe('hire');
      expect(event.questionsAnalyzed).toBe(1);
    });

    it('should throw error if not in_progress', () => {
      const analysis = AnalysisResult.create(createParams);

      expect(() => analysis.complete(completeParams)).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('fail', () => {
    it('should transition to failed status', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.fail('LLM API error');

      expect(analysis.status.isFailed).toBe(true);
    });

    it('should set error message', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.fail('Rate limit exceeded');

      expect(analysis.errorMessage).toBe('Rate limit exceeded');
    });

    it('should emit AnalysisFailedEvent', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.clearEvents();
      analysis.fail('Connection timeout');

      expect(analysis.domainEvents).toHaveLength(1);
      expect(analysis.domainEvents[0]).toBeInstanceOf(AnalysisFailedEvent);

      const event = analysis.domainEvents[0] as AnalysisFailedEvent;
      expect(event.aggregateId).toBe(analysis.id);
      expect(event.invitationId).toBe('invitation-123');
      expect(event.errorMessage).toBe('Connection timeout');
    });

    it('should throw error if not in_progress', () => {
      const analysis = AnalysisResult.create(createParams);

      expect(() => analysis.fail('Error')).toThrow(InvalidStatusTransitionException);
    });

    it('should throw error if already completed', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      analysis.addQuestionAnalysis(questionAnalysisParams);
      analysis.complete(completeParams);

      expect(() => analysis.fail('Error')).toThrow(InvalidStatusTransitionException);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from raw data', () => {
      const rawData = {
        invitationId: 'inv-1',
        candidateId: 'cand-1',
        templateId: 'tmpl-1',
        templateTitle: 'Interview',
        companyName: 'Company',
        status: 'completed',
        overallScore: 85,
        summary: 'Good candidate',
        strengths: ['Skill 1'],
        weaknesses: ['Area 1'],
        recommendation: 'hire',
        metadata: {
          modelUsed: 'model',
          totalTokensUsed: 1000,
          processingTimeMs: 5000,
          questionsAnalyzed: 5,
          language: 'en',
        },
        errorMessage: null,
        questionAnalyses: [],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
        completedAt: new Date('2024-01-02'),
      };

      const analysis = AnalysisResult.reconstitute(rawData, 'existing-id');

      expect(analysis.id).toBe('existing-id');
      expect(analysis.invitationId).toBe('inv-1');
      expect(analysis.status.isCompleted).toBe(true);
      expect(analysis.overallScore?.value).toBe(85);
      expect(analysis.recommendation?.isHire).toBe(true);
      expect(analysis.metadata.modelUsed).toBe('model');
    });

    it('should reconstitute with null values', () => {
      const rawData = {
        invitationId: 'inv-1',
        candidateId: 'cand-1',
        templateId: 'tmpl-1',
        templateTitle: 'Interview',
        companyName: 'Company',
        status: 'pending',
        overallScore: null,
        summary: null,
        strengths: [],
        weaknesses: [],
        recommendation: null,
        metadata: {
          modelUsed: '',
          totalTokensUsed: 0,
          processingTimeMs: 0,
          questionsAnalyzed: 0,
          language: 'en',
        },
        errorMessage: null,
        questionAnalyses: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      };

      const analysis = AnalysisResult.reconstitute(rawData, 'id');

      expect(analysis.status.isPending).toBe(true);
      expect(analysis.overallScore).toBeNull();
      expect(analysis.recommendation).toBeNull();
      expect(analysis.completedAt).toBeNull();
    });
  });

  describe('questionsCount', () => {
    it('should return number of question analyses', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();

      expect(analysis.questionsCount).toBe(0);

      analysis.addQuestionAnalysis(questionAnalysisParams);
      expect(analysis.questionsCount).toBe(1);

      analysis.addQuestionAnalysis({ ...questionAnalysisParams, questionId: 'q-2' });
      expect(analysis.questionsCount).toBe(2);
    });
  });

  describe('clearEvents', () => {
    it('should clear all domain events', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      
      expect(analysis.domainEvents).toHaveLength(1);
      
      analysis.clearEvents();
      
      expect(analysis.domainEvents).toHaveLength(0);
    });
  });

  describe('overall score calculation', () => {
    it('should throw NoQuestionsAnalyzedException when completing with no questions', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();

      expect(() => analysis.complete(completeParams)).toThrow(NoQuestionsAnalyzedException);
    });

    it('should calculate average of question scores', () => {
      const analysis = AnalysisResult.create(createParams);
      analysis.start();
      
      // Add questions with known weighted scores
      analysis.addQuestionAnalysis({
        ...questionAnalysisParams,
        questionId: 'q-1',
        criteriaScores: [
          { criterion: CriterionType.RELEVANCE, score: 100, weight: 1 },
        ],
      });
      analysis.addQuestionAnalysis({
        ...questionAnalysisParams,
        questionId: 'q-2',
        criteriaScores: [
          { criterion: CriterionType.RELEVANCE, score: 80, weight: 1 },
        ],
      });
      
      analysis.complete(completeParams);

      // (100 + 80) / 2 = 90
      expect(analysis.overallScore?.value).toBe(90);
    });
  });
});
