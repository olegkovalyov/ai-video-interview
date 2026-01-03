import { QuestionAnalysis, CreateQuestionAnalysisParams } from '../question-analysis.entity';
import { QuestionType } from '../../value-objects/question-type.vo';
import { CriterionType } from '../../value-objects/criteria-score.vo';

describe('QuestionAnalysis Entity', () => {
  const validParams: CreateQuestionAnalysisParams = {
    questionId: 'question-123',
    questionText: 'What is dependency injection?',
    questionType: QuestionType.text(),
    responseText: 'Dependency injection is a design pattern...',
    score: 85,
    feedback: 'Good explanation with clear examples.',
    criteriaScores: [
      { criterion: CriterionType.RELEVANCE, score: 90, weight: 0.25 },
      { criterion: CriterionType.COMPLETENESS, score: 80, weight: 0.25 },
      { criterion: CriterionType.CLARITY, score: 85, weight: 0.25 },
      { criterion: CriterionType.DEPTH, score: 85, weight: 0.25 },
    ],
    isCorrect: undefined,
    tokensUsed: 500,
  };

  describe('create', () => {
    it('should create a question analysis with valid params', () => {
      const qa = QuestionAnalysis.create(validParams);

      expect(qa.id).toBeDefined();
      expect(qa.questionId).toBe('question-123');
      expect(qa.questionText).toBe('What is dependency injection?');
      expect(qa.questionType.isText).toBe(true);
      expect(qa.responseText).toBe('Dependency injection is a design pattern...');
      expect(qa.score.value).toBe(85);
      expect(qa.feedback).toBe('Good explanation with clear examples.');
      expect(qa.criteriaScores).toHaveLength(4);
      expect(qa.tokensUsed).toBe(500);
      expect(qa.createdAt).toBeInstanceOf(Date);
    });

    it('should create with custom id', () => {
      const qa = QuestionAnalysis.create(validParams, 'custom-id');
      expect(qa.id).toBe('custom-id');
    });

    it('should create for multiple choice question with isCorrect', () => {
      const params: CreateQuestionAnalysisParams = {
        ...validParams,
        questionType: QuestionType.multipleChoice(),
        isCorrect: true,
      };
      const qa = QuestionAnalysis.create(params);

      expect(qa.questionType.isMultipleChoice).toBe(true);
      expect(qa.isCorrect).toBe(true);
    });

    it('should create with empty criteria scores', () => {
      const params: CreateQuestionAnalysisParams = {
        ...validParams,
        criteriaScores: [],
      };
      const qa = QuestionAnalysis.create(params);

      expect(qa.criteriaScores).toHaveLength(0);
    });
  });

  describe('reconstitute', () => {
    it('should reconstitute from raw data', () => {
      const rawData = {
        questionId: 'question-123',
        questionText: 'What is DI?',
        questionType: 'text',
        responseText: 'DI is...',
        score: 75,
        feedback: 'Good',
        criteriaScores: [
          { criterion: 'relevance', score: 80, weight: 0.5 },
          { criterion: 'clarity', score: 70, weight: 0.5 },
        ],
        isCorrect: undefined,
        tokensUsed: 300,
        createdAt: new Date('2024-01-01'),
      };

      const qa = QuestionAnalysis.reconstitute(rawData, 'existing-id');

      expect(qa.id).toBe('existing-id');
      expect(qa.questionId).toBe('question-123');
      expect(qa.questionType.isText).toBe(true);
      expect(qa.score.value).toBe(75);
      expect(qa.criteriaScores).toHaveLength(2);
      expect(qa.createdAt).toEqual(new Date('2024-01-01'));
    });
  });

  describe('weightedScore', () => {
    it('should calculate weighted score from criteria scores', () => {
      const params: CreateQuestionAnalysisParams = {
        ...validParams,
        criteriaScores: [
          { criterion: CriterionType.RELEVANCE, score: 100, weight: 0.5 },
          { criterion: CriterionType.CLARITY, score: 80, weight: 0.5 },
        ],
      };
      const qa = QuestionAnalysis.create(params);

      // (100 * 0.5 + 80 * 0.5) / (0.5 + 0.5) = 90
      expect(qa.weightedScore).toBe(90);
    });

    it('should return main score when no criteria scores', () => {
      const params: CreateQuestionAnalysisParams = {
        ...validParams,
        score: 75,
        criteriaScores: [],
      };
      const qa = QuestionAnalysis.create(params);

      expect(qa.weightedScore).toBe(75);
    });

    it('should handle unequal weights', () => {
      const params: CreateQuestionAnalysisParams = {
        ...validParams,
        criteriaScores: [
          { criterion: CriterionType.RELEVANCE, score: 100, weight: 0.7 },
          { criterion: CriterionType.CLARITY, score: 50, weight: 0.3 },
        ],
      };
      const qa = QuestionAnalysis.create(params);

      // (100 * 0.7 + 50 * 0.3) / (0.7 + 0.3) = (70 + 15) / 1 = 85
      expect(qa.weightedScore).toBe(85);
    });
  });

  describe('equals', () => {
    it('should return true for same id', () => {
      const qa1 = QuestionAnalysis.create(validParams, 'same-id');
      const qa2 = QuestionAnalysis.create(validParams, 'same-id');
      expect(qa1.equals(qa2)).toBe(true);
    });

    it('should return false for different ids', () => {
      const qa1 = QuestionAnalysis.create(validParams, 'id-1');
      const qa2 = QuestionAnalysis.create(validParams, 'id-2');
      expect(qa1.equals(qa2)).toBe(false);
    });
  });
});
