import { CommandHandler, ICommandHandler, CommandBus } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { RetryAnalysisCommand } from './retry-analysis.command';
import { AnalyzeInterviewCommand } from '../analyze-interview/analyze-interview.command';
import { ANALYSIS_RESULT_REPOSITORY } from '../../ports';
import type { IAnalysisResultRepository } from '../../ports';
import { AnalysisNotFoundException } from '../../../domain/exceptions/analysis.exceptions';
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
      throw new Error(`Cannot retry analysis with status: ${existingAnalysis.status.value}`);
    }

    await this.repository.delete(analysisId);

    this.logger.log(`Deleted failed analysis: ${analysisId}, restarting...`);

    const eventData: InvitationCompletedEventData = {
      invitationId: existingAnalysis.invitationId,
      candidateId: existingAnalysis.candidateId,
      templateId: existingAnalysis.templateId,
      templateTitle: existingAnalysis.templateTitle,
      companyName: existingAnalysis.companyName,
      completedAt: new Date(),
      questions: [],
      responses: [],
    };

    return this.commandBus.execute(new AnalyzeInterviewCommand(eventData));
  }
}
