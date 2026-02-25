import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RetryAnalysisCommand } from './retry-analysis.command';
import { AnalyzeInterviewCommand } from '../analyze-interview/analyze-interview.command';
import { ANALYSIS_RESULT_REPOSITORY } from '../../ports';
import type { IAnalysisResultRepository } from '../../ports';
import { AnalysisNotFoundException, InvalidStatusTransitionException } from '../../../domain/exceptions/analysis.exceptions';
import { AnalysisResultResponse } from '../../dto/responses/analysis-result.response';
import { InvitationCompletedEventData } from '../../dto/kafka/invitation-completed.event';

@CommandHandler(RetryAnalysisCommand)
export class RetryAnalysisHandler implements ICommandHandler<RetryAnalysisCommand> {
  private readonly logger = new Logger(RetryAnalysisHandler.name);

  constructor(
    @Inject(ANALYSIS_RESULT_REPOSITORY)
    private readonly repository: IAnalysisResultRepository,

    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: RetryAnalysisCommand): Promise<AnalysisResultResponse> {
    const { analysisId } = command;

    this.logger.log(`Retrying analysis: ${analysisId}`);

    const existingAnalysis = await this.repository.findById(analysisId);
    if (!existingAnalysis) {
      throw new AnalysisNotFoundException(analysisId);
    }

    if (!existingAnalysis.status.isFailed) {
      throw new InvalidStatusTransitionException(existingAnalysis.status.value, 'retry');
    }

    // Retrieve stored event data from initial analysis run
    const sourceEventData = await this.repository.getSourceEventData(analysisId);
    if (!sourceEventData) {
      throw new AnalysisNotFoundException(
        `${analysisId} (source event data not available — analysis was created before event data storage was implemented)`,
      );
    }

    await this.repository.delete(analysisId);

    this.logger.log(`Deleted failed analysis: ${analysisId}, restarting with stored event data...`);

    const eventData = sourceEventData as unknown as InvitationCompletedEventData;

    return this.commandBus.execute(new AnalyzeInterviewCommand(eventData));
  }
}
