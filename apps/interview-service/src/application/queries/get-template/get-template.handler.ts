import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetTemplateQuery } from './get-template.query';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import { TemplateResponseDto } from '../../dto/template.response.dto';
import { QuestionResponseDto } from '../../dto/question.response.dto';
import { InterviewSettingsResponseDto } from '../../dto/interview-settings.response.dto';

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<GetTemplateQuery> {
  private readonly logger = new Logger(GetTemplateHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
  ) {}

  async execute(query: GetTemplateQuery): Promise<TemplateResponseDto> {
    this.logger.log(`Getting template: ${query.templateId}`);

    // Load template
    const template = await this.templateRepository.findById(query.templateId);
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${query.templateId} not found`,
      );
    }

    // RBAC: HR can only see their own templates, Admin sees all
    if (query.userRole === 'hr' && query.userId) {
      if (!template.isOwnedBy(query.userId)) {
        throw new ForbiddenException(
          'You do not have permission to view this template',
        );
      }
    }

    // Map to DTO
    const questions = template.getSortedQuestions();
    
    return {
      id: template.id,
      title: template.title,
      description: template.description,
      status: template.status.toString(),
      createdBy: template.createdBy,
      settings: this.mapSettings(template.settings),
      questions: questions.map((q) => this.mapQuestion(q)),
      questionsCount: template.getQuestionsCount(),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private mapSettings(settings: any): InterviewSettingsResponseDto {
    return {
      totalTimeLimit: settings.totalTimeLimit,
      allowRetakes: settings.allowRetakes,
      showTimer: settings.showTimer,
      randomizeQuestions: settings.randomizeQuestions,
    };
  }

  private mapQuestion(question: any): QuestionResponseDto {
    return {
      id: question.id,
      text: question.text,
      type: question.type.toString(),
      order: question.order,
      timeLimit: question.timeLimit,
      required: question.required,
      hints: question.hints,
      createdAt: question.createdAt,
    };
  }
}
