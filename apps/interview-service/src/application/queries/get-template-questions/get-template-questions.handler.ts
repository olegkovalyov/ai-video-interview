import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { GetTemplateQuestionsQuery } from './get-template-questions.query';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import { QuestionResponseDto } from '../../dto/question.response.dto';

@QueryHandler(GetTemplateQuestionsQuery)
export class GetTemplateQuestionsHandler
  implements IQueryHandler<GetTemplateQuestionsQuery>
{
  private readonly logger = new Logger(GetTemplateQuestionsHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
  ) {}

  async execute(
    query: GetTemplateQuestionsQuery,
  ): Promise<QuestionResponseDto[]> {
    this.logger.log(`Getting questions for template: ${query.templateId}`);

    // Load template
    const template = await this.templateRepository.findById(query.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${query.templateId} not found`,
      );
    }

    // Get sorted questions
    const questions = template.getSortedQuestions();

    // Map to DTOs
    return questions.map((question) => ({
      id: question.id,
      text: question.text,
      type: question.type.toString(),
      order: question.order,
      timeLimit: question.timeLimit,
      required: question.required,
      hints: question.hints,
      createdAt: question.createdAt,
    }));
  }
}
