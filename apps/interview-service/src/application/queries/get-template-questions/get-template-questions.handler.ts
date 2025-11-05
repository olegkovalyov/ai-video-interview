import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException } from '@nestjs/common';
import { GetTemplateQuestionsQuery } from './get-template-questions.query';
import { QuestionResponseDto } from '../../dto/question.response.dto';
import { InterviewTemplateReadRepository } from '../../../infrastructure/persistence/repositories/interview-template-read.repository';

@QueryHandler(GetTemplateQuestionsQuery)
export class GetTemplateQuestionsHandler
  implements IQueryHandler<GetTemplateQuestionsQuery>
{
  private readonly logger = new Logger(GetTemplateQuestionsHandler.name);

  constructor(
    private readonly readRepository: InterviewTemplateReadRepository,
  ) {}

  async execute(
    query: GetTemplateQuestionsQuery,
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`Getting questions for template: ${query.templateId}`);

    // Check if template exists
    const exists = await this.readRepository.exists(query.templateId);
    if (!exists) {
      throw new NotFoundException(
        `Template with ID ${query.templateId} not found`,
      );
    }

    // Load questions directly (no aggregate!)
    return this.readRepository.findQuestions(query.templateId);
  }
}
