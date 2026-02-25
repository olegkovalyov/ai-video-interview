import { GetAnalysisResultHandler } from '../get-analysis-result.handler';
import { GetAnalysisResultQuery } from '../get-analysis-result.query';
import { IAnalysisResultRepository } from '../../../ports';
import { AnalysisResult } from '../../../../domain/aggregates/analysis-result.aggregate';
import { AnalysisNotFoundException } from '../../../../domain/exceptions/analysis.exceptions';

describe('GetAnalysisResultHandler', () => {
  let handler: GetAnalysisResultHandler;
  let mockRepository: jest.Mocked<IAnalysisResultRepository>;

  const createMockAnalysis = (): AnalysisResult => {
    const analysis = AnalysisResult.create({
      invitationId: 'inv-123',
      candidateId: 'cand-456',
      templateId: 'tmpl-789',
      templateTitle: 'Developer Interview',
      companyName: 'Tech Corp',
    }, 'analysis-123');
    return analysis;
  };

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findByInvitationId: jest.fn(),
      findAll: jest.fn(),
      existsByInvitationId: jest.fn(),
      delete: jest.fn(),
      saveSourceEventData: jest.fn(),
      getSourceEventData: jest.fn(),
    };

    handler = new GetAnalysisResultHandler(mockRepository);
  });

  describe('execute', () => {
    it('should return analysis result when found', async () => {
      const mockAnalysis = createMockAnalysis();
      mockRepository.findById.mockResolvedValue(mockAnalysis);

      const query = new GetAnalysisResultQuery('analysis-123');
      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.id).toBe('analysis-123');
      expect(result.invitationId).toBe('inv-123');
      expect(mockRepository.findById).toHaveBeenCalledWith('analysis-123');
    });

    it('should throw AnalysisNotFoundException when not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const query = new GetAnalysisResultQuery('non-existent');

      await expect(handler.execute(query)).rejects.toThrow(AnalysisNotFoundException);
      await expect(handler.execute(query)).rejects.toThrow('non-existent');
    });

    it('should include question analyses in response', async () => {
      const mockAnalysis = createMockAnalysis();
      mockRepository.findById.mockResolvedValue(mockAnalysis);

      const query = new GetAnalysisResultQuery('analysis-123');
      const result = await handler.execute(query);

      expect(result.questionAnalyses).toBeDefined();
      expect(Array.isArray(result.questionAnalyses)).toBe(true);
    });
  });
});
