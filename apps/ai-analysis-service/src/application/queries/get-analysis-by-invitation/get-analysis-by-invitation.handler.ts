import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetAnalysisByInvitationQuery } from './get-analysis-by-invitation.query';
import { ANALYSIS_RESULT_REPOSITORY } from '../../ports';
import type { IAnalysisResultRepository } from '../../ports';
import { AnalysisNotFoundException } from '../../../domain/exceptions/analysis.exceptions';
import { AnalysisResultWithQuestionsResponse } from '../../dto/responses/analysis-result.response';
import { AnalysisResultMapper } from '../../mappers/analysis-result.mapper';

@QueryHandler(GetAnalysisByInvitationQuery)
export class GetAnalysisByInvitationHandler implements IQueryHandler<GetAnalysisByInvitationQuery> {
  constructor(
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly repository: IAnalysisResultRepository,
  ) {}

  async execute(query: GetAnalysisByInvitationQuery): Promise<AnalysisResultWithQuestionsResponse> {
    const analysis = await this.repository.findByInvitationId(query.invitationId);

    if (!analysis) {
      throw new AnalysisNotFoundException(`invitation:${query.invitationId}`);
    }

    return AnalysisResultMapper.toResponseWithQuestions(analysis);
  }
}
