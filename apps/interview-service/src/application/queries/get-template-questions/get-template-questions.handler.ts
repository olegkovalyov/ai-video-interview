import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTemplateQuestionsQuery } from './get-template-questions.query';
import { QuestionResponseDto } from '../../dto/question.response.dto';
import { IInterviewTemplateReadRepository } from '../../../domain/repositories/interview-template-read.repository.interface';
import { TemplateNotFoundException } from '../../../domain/exceptions/interview-template.exceptions';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

@QueryHandler(GetTemplateQuestionsQuery)
export class GetTemplateQuestionsHandler
  implements IQueryHandler<GetTemplateQuestionsQuery>
{
  constructor(
    @Inject('IInterviewTemplateReadRepository')
    private readonly readRepository: IInterviewTemplateReadRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    query: GetTemplateQuestionsQuery,
  ): Promise<QuestionResponseDto[]> {
    this.logger.info(`Getting questions for template: ${query.templateId}`);

    // Check if template exists
    const exists = await this.readRepository.exists(query.templateId);
    if (!exists) {
      throw new TemplateNotFoundException(query.templateId);
    }

    // Load questions directly (no aggregate!)
    return this.readRepository.findQuestions(query.templateId);
  }
}
