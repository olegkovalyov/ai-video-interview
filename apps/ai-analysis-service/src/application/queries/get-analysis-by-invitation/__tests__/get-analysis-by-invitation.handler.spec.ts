import { GetAnalysisByInvitationHandler } from '../get-analysis-by-invitation.handler';
import { GetAnalysisByInvitationQuery } from '../get-analysis-by-invitation.query';
import { IAnalysisResultRepository } from '../../../ports';
import { AnalysisResult } from '../../../../domain/aggregates/analysis-result.aggregate';
import { AnalysisNotFoundException } from '../../../../domain/exceptions/analysis.exceptions';

describe('GetAnalysisByInvitationHandler', () => {
  let handler: GetAnalysisByInvitationHandler;
  let mockRepository: jest.Mocked<IAnalysisResultRepository>;

  const createMockAnalysis = (): AnalysisResult => {
    return AnalysisResult.create({
      invitationId: 'inv-123',
      candidateId: 'cand-456',
      templateId: 'tmpl-789',
      templateTitle: 'Developer Interview',
      companyName: 'Tech Corp',
    }, 'analysis-123');
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

    handler = new GetAnalysisByInvitationHandler(mockRepository);
  });

  describe('execute', () => {
    it('should return analysis result when found by invitation ID', async () => {
      const mockAnalysis = createMockAnalysis();
      mockRepository.findByInvitationId.mockResolvedValue(mockAnalysis);

      const query = new GetAnalysisByInvitationQuery('inv-123');
      const result = await handler.execute(query);

      expect(result).toBeDefined();
      expect(result.invitationId).toBe('inv-123');
      expect(mockRepository.findByInvitationId).toHaveBeenCalledWith('inv-123');
    });

    it('should throw AnalysisNotFoundException when not found', async () => {
      mockRepository.findByInvitationId.mockResolvedValue(null);

      const query = new GetAnalysisByInvitationQuery('non-existent');

      await expect(handler.execute(query)).rejects.toThrow(AnalysisNotFoundException);
    });
  });
});
