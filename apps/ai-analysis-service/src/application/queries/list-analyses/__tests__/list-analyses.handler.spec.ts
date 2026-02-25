import { ListAnalysesHandler } from '../list-analyses.handler';
import { ListAnalysesQuery } from '../list-analyses.query';
import { IAnalysisResultRepository, PaginatedResult } from '../../../ports';
import { AnalysisResult } from '../../../../domain/aggregates/analysis-result.aggregate';
import { AnalysisStatusEnum } from '../../../../domain/value-objects/analysis-status.vo';

describe('ListAnalysesHandler', () => {
  let handler: ListAnalysesHandler;
  let mockRepository: jest.Mocked<IAnalysisResultRepository>;

  const createMockAnalysis = (id: string, invitationId: string): AnalysisResult => {
    return AnalysisResult.create({
      invitationId,
      candidateId: 'cand-456',
      templateId: 'tmpl-789',
      templateTitle: 'Developer Interview',
      companyName: 'Tech Corp',
    }, id);
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

    handler = new ListAnalysesHandler(mockRepository);
  });

  describe('execute', () => {
    it('should return paginated list of analyses', async () => {
      const mockResult: PaginatedResult<AnalysisResult> = {
        items: [
          createMockAnalysis('a-1', 'inv-1'),
          createMockAnalysis('a-2', 'inv-2'),
        ],
        total: 10,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      mockRepository.findAll.mockResolvedValue(mockResult);

      const query = new ListAnalysesQuery(1, 20);
      const result = await handler.execute(query);

      expect(result.items).toHaveLength(2);
      expect(result.meta.total).toBe(10);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(20);
    });

    it('should pass filters to repository', async () => {
      mockRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });

      const query = new ListAnalysesQuery(
        2,
        10,
        AnalysisStatusEnum.COMPLETED,
        'cand-123',
        'tmpl-456',
      );
      await handler.execute(query);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        status: AnalysisStatusEnum.COMPLETED,
        candidateId: 'cand-123',
        templateId: 'tmpl-456',
      });
    });

    it('should return empty list when no results', async () => {
      mockRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const query = new ListAnalysesQuery();
      const result = await handler.execute(query);

      expect(result.items).toHaveLength(0);
      expect(result.meta.total).toBe(0);
    });

    it('should use default pagination values', async () => {
      mockRepository.findAll.mockResolvedValue({
        items: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0,
      });

      const query = new ListAnalysesQuery();
      await handler.execute(query);

      expect(mockRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        status: undefined,
        candidateId: undefined,
        templateId: undefined,
      });
    });
  });
});
