import { AnalysisResultPersistenceMapper } from '../analysis-result-persistence.mapper';
import { AnalysisResult } from '../../../../domain/aggregates/analysis-result.aggregate';
import { QuestionType } from '../../../../domain/value-objects/question-type.vo';
import { AnalysisResultEntity } from '../../entities/analysis-result.entity';
import { QuestionAnalysisEntity } from '../../entities/question-analysis.entity';

describe('AnalysisResultPersistenceMapper', () => {
  let mapper: AnalysisResultPersistenceMapper;

  beforeEach(() => {
    mapper = new AnalysisResultPersistenceMapper();
  });

  const createCompletedAnalysis = (): AnalysisResult => {
    const analysis = AnalysisResult.create({
      invitationId: 'inv-123',
      candidateId: 'cand-456',
      templateId: 'tmpl-789',
      templateTitle: 'Developer Interview',
      companyName: 'Tech Corp',
    }, 'analysis-001');

    analysis.start();

    analysis.addQuestionAnalysis({
      questionId: 'q-1',
      questionText: 'What is DI?',
      questionType: QuestionType.fromString('text'),
      responseText: 'Dependency Injection is...',
      score: 85,
      feedback: 'Good explanation',
      criteriaScores: [
        { criterion: 'relevance' as any, score: 90, weight: 0.25 },
        { criterion: 'completeness' as any, score: 80, weight: 0.25 },
        { criterion: 'clarity' as any, score: 85, weight: 0.25 },
        { criterion: 'depth' as any, score: 85, weight: 0.25 },
      ],
      tokensUsed: 500,
    });

    analysis.complete({
      summary: 'Strong candidate',
      strengths: ['Good knowledge', 'Clear communication'],
      weaknesses: ['Could improve depth'],
      recommendation: 'hire',
      modelUsed: 'llama-3.3-70b',
      totalTokensUsed: 800,
      processingTimeMs: 5000,
      language: 'en',
    });

    return analysis;
  };

  describe('toEntity', () => {
    it('should map a completed domain aggregate to entity', () => {
      const domain = createCompletedAnalysis();
      const entity = mapper.toEntity(domain);

      expect(entity).toBeInstanceOf(AnalysisResultEntity);
      expect(entity.id).toBe('analysis-001');
      expect(entity.invitationId).toBe('inv-123');
      expect(entity.candidateId).toBe('cand-456');
      expect(entity.templateId).toBe('tmpl-789');
      expect(entity.templateTitle).toBe('Developer Interview');
      expect(entity.companyName).toBe('Tech Corp');
      expect(entity.status).toBe('completed');
      expect(entity.overallScore).toBe(85);
      expect(entity.summary).toBe('Strong candidate');
      expect(entity.strengths).toEqual(['Good knowledge', 'Clear communication']);
      expect(entity.weaknesses).toEqual(['Could improve depth']);
      expect(entity.recommendation).toBe('hire');
      expect(entity.modelUsed).toBe('llama-3.3-70b');
      expect(entity.totalTokensUsed).toBe(800);
      expect(entity.processingTimeMs).toBe(5000);
      expect(entity.language).toBe('en');
      expect(entity.questionAnalyses).toHaveLength(1);
    });

    it('should map question analyses to entities', () => {
      const domain = createCompletedAnalysis();
      const entity = mapper.toEntity(domain);
      const qaEntity = entity.questionAnalyses[0];

      expect(qaEntity).toBeInstanceOf(QuestionAnalysisEntity);
      expect(qaEntity.analysisResultId).toBe('analysis-001');
      expect(qaEntity.questionId).toBe('q-1');
      expect(qaEntity.questionText).toBe('What is DI?');
      expect(qaEntity.questionType).toBe('text');
      expect(qaEntity.responseText).toBe('Dependency Injection is...');
      expect(qaEntity.score).toBe(85);
      expect(qaEntity.feedback).toBe('Good explanation');
      expect(qaEntity.tokensUsed).toBe(500);
      expect(qaEntity.criteriaScores).toHaveLength(4);
    });

    it('should map a pending analysis with null optional fields', () => {
      const domain = AnalysisResult.create({
        invitationId: 'inv-new',
        candidateId: 'cand-new',
        templateId: 'tmpl-new',
        templateTitle: 'New Interview',
        companyName: 'Startup',
      }, 'analysis-new');

      const entity = mapper.toEntity(domain);

      expect(entity.status).toBe('pending');
      expect(entity.overallScore).toBeNull();
      expect(entity.summary).toBeNull();
      expect(entity.recommendation).toBeNull();
      expect(entity.questionAnalyses).toHaveLength(0);
    });
  });

  describe('toDomain', () => {
    it('should map an entity back to a domain aggregate', () => {
      const entity = new AnalysisResultEntity();
      entity.id = 'analysis-001';
      entity.invitationId = 'inv-123';
      entity.candidateId = 'cand-456';
      entity.templateId = 'tmpl-789';
      entity.templateTitle = 'Developer Interview';
      entity.companyName = 'Tech Corp';
      entity.status = 'completed';
      entity.overallScore = 85;
      entity.summary = 'Strong candidate';
      entity.strengths = ['Good knowledge'];
      entity.weaknesses = ['Could improve depth'];
      entity.recommendation = 'hire';
      entity.modelUsed = 'llama-3.3-70b';
      entity.totalTokensUsed = 800;
      entity.processingTimeMs = 5000;
      entity.language = 'en';
      entity.errorMessage = null;
      entity.createdAt = new Date('2026-01-01');
      entity.updatedAt = new Date('2026-01-01');
      entity.completedAt = new Date('2026-01-01');
      entity.questionAnalyses = [];

      const domain = mapper.toDomain(entity);

      expect(domain).toBeInstanceOf(AnalysisResult);
      expect(domain.id).toBe('analysis-001');
      expect(domain.invitationId).toBe('inv-123');
      expect(domain.status.value).toBe('completed');
      expect(domain.overallScore?.value).toBe(85);
      expect(domain.recommendation?.value).toBe('hire');
      expect(domain.metadata.modelUsed).toBe('llama-3.3-70b');
    });

    it('should handle null optional fields in entity', () => {
      const entity = new AnalysisResultEntity();
      entity.id = 'analysis-002';
      entity.invitationId = 'inv-pending';
      entity.candidateId = 'cand-pending';
      entity.templateId = 'tmpl-pending';
      entity.templateTitle = 'Pending Interview';
      entity.companyName = 'Corp';
      entity.status = 'pending';
      entity.overallScore = null;
      entity.summary = null;
      entity.strengths = null as any;
      entity.weaknesses = null as any;
      entity.recommendation = null;
      entity.modelUsed = null;
      entity.totalTokensUsed = 0;
      entity.processingTimeMs = 0;
      entity.language = 'en';
      entity.errorMessage = null;
      entity.createdAt = new Date();
      entity.updatedAt = new Date();
      entity.completedAt = null;
      entity.questionAnalyses = [];

      const domain = mapper.toDomain(entity);

      expect(domain.status.value).toBe('pending');
      expect(domain.overallScore).toBeNull();
      expect(domain.recommendation).toBeNull();
      expect(domain.strengths).toEqual([]);
      expect(domain.weaknesses).toEqual([]);
    });
  });

  describe('roundtrip', () => {
    it('should preserve data through domain -> entity -> domain', () => {
      const original = createCompletedAnalysis();
      const entity = mapper.toEntity(original);
      const reconstructed = mapper.toDomain(entity);

      expect(reconstructed.id).toBe(original.id);
      expect(reconstructed.invitationId).toBe(original.invitationId);
      expect(reconstructed.candidateId).toBe(original.candidateId);
      expect(reconstructed.status.value).toBe(original.status.value);
      expect(reconstructed.overallScore?.value).toBe(original.overallScore?.value);
      expect(reconstructed.summary).toBe(original.summary);
      expect(reconstructed.strengths).toEqual(original.strengths);
      expect(reconstructed.weaknesses).toEqual(original.weaknesses);
      expect(reconstructed.recommendation?.value).toBe(original.recommendation?.value);
      expect(reconstructed.questionAnalyses).toHaveLength(original.questionAnalyses.length);

      const origQa = original.questionAnalyses[0];
      const reconQa = reconstructed.questionAnalyses[0];
      expect(reconQa.questionId).toBe(origQa.questionId);
      expect(reconQa.score.value).toBe(origQa.score.value);
      expect(reconQa.feedback).toBe(origQa.feedback);
      expect(reconQa.criteriaScores).toHaveLength(origQa.criteriaScores.length);
    });
  });
});
