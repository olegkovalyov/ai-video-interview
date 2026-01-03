import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListAnalysesQuery } from './list-analyses.query';
import { ANALYSIS_RESULT_REPOSITORY } from '../../ports';
import type { IAnalysisResultRepository } from '../../ports';
import { AnalysisListResponse } from '../../dto/responses/analysis-list.response';
import { AnalysisResultMapper } from '../../mappers/analysis-result.mapper';

@QueryHandler(ListAnalysesQuery)
export class ListAnalysesHandler implements IQueryHandler<ListAnalysesQuery> {
  constructor(
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly repository: IAnalysisResultRepository,
  ) {}

  async execute(query: ListAnalysesQuery): Promise<AnalysisListResponse> {
    const result = await this.repository.findAll({
      page: query.page,
      limit: query.limit,
      status: query.status,
      candidateId: query.candidateId,
      templateId: query.templateId,
    });

    return {
      items: result.items.map(analysis => AnalysisResultMapper.toResponse(analysis)),
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}
