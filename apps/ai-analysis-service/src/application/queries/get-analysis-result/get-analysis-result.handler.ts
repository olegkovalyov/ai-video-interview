import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAnalysisResultQuery } from './get-analysis-result.query';
import { ANALYSIS_RESULT_REPOSITORY } from '../../ports';
import type { IAnalysisResultRepository } from '../../ports';
import { AnalysisNotFoundException } from '../../../domain/exceptions/analysis.exceptions';
import { AnalysisResultWithQuestionsResponse } from '../../dto/responses/analysis-result.response';
import { AnalysisResultMapper } from '../../mappers/analysis-result.mapper';

@QueryHandler(GetAnalysisResultQuery)
export class GetAnalysisResultHandler implements IQueryHandler<GetAnalysisResultQuery> {
  constructor(
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly repository: IAnalysisResultRepository,
  ) {}

  async execute(query: GetAnalysisResultQuery): Promise<AnalysisResultWithQuestionsResponse> {
    const analysis = await this.repository.findById(query.analysisId);

    if (!analysis) {
      throw new AnalysisNotFoundException(query.analysisId);
    }

    return AnalysisResultMapper.toResponseWithQuestions(analysis);
  }
}
