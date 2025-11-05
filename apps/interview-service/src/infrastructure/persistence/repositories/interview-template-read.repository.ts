import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InterviewTemplateEntity } from '../entities/interview-template.entity';
import { QuestionEntity } from '../entities/question.entity';
import {
  TemplateResponseDto,
  TemplateListItemDto,
  PaginatedTemplatesResponseDto,
  QuestionResponseDto,
} from '../../../application/dto';

/**
 * Read Repository для Query side (CQRS)
 * Работает напрямую с TypeORM entities без Domain aggregates
 */
@Injectable()
export class InterviewTemplateReadRepository {
  constructor(
    @InjectRepository(InterviewTemplateEntity)
    private readonly templateRepository: Repository<InterviewTemplateEntity>,
    @InjectRepository(QuestionEntity)
    private readonly questionRepository: Repository<QuestionEntity>,
  ) {}

  /**
   * Get single template with questions (для GetTemplateQuery)
   */
  async findById(id: string): Promise<TemplateResponseDto | null> {
    const entity = await this.templateRepository.findOne({
      where: { id },
      relations: ['questions'],
    });

    if (!entity) {
      return null;
    }

    return this.mapToFullDto(entity);
  }

  /**
   * List templates with pagination (для ListTemplatesQuery)
   */
  async findAll(
    filters: {
      createdBy?: string;
      status?: string;
    },
    skip: number,
    limit: number,
  ): Promise<PaginatedTemplatesResponseDto> {
    const where: any = {};

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [entities, total] = await this.templateRepository.findAndCount({
      where,
      relations: ['questions'], // Загружаем questions для questionsCount
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const items = entities.map((entity) => this.mapToListItemDto(entity));
    const totalPages = Math.ceil(total / limit);
    const page = Math.floor(skip / limit) + 1;

    return {
      items,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get only questions for template (для GetTemplateQuestionsQuery)
   */
  async findQuestions(templateId: string): Promise<QuestionResponseDto[]> {
    const questions = await this.questionRepository.find({
      where: { templateId },
      order: { order: 'ASC' },
    });

    return questions.map((q) => this.mapQuestionToDto(q));
  }

  /**
   * Check if template exists
   */
  async exists(id: string): Promise<boolean> {
    const count = await this.templateRepository.count({ where: { id } });
    return count > 0;
  }

  // =========== PRIVATE MAPPERS ===========

  /**
   * Map Entity to Full DTO (для GetTemplateQuery)
   */
  private mapToFullDto(entity: InterviewTemplateEntity): TemplateResponseDto {
    const questions = entity.questions
      ? entity.questions
          .sort((a, b) => a.order - b.order)
          .map((q) => this.mapQuestionToDto(q))
      : [];

    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      createdBy: entity.createdBy,
      settings: entity.settings,
      questions,
      questionsCount: questions.length,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map Entity to List Item DTO (для ListTemplatesQuery)
   */
  private mapToListItemDto(
    entity: InterviewTemplateEntity,
  ): TemplateListItemDto {
    return {
      id: entity.id,
      title: entity.title,
      description: entity.description,
      status: entity.status,
      createdBy: entity.createdBy,
      questionsCount: entity.questions ? entity.questions.length : 0,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  /**
   * Map Question Entity to DTO
   */
  private mapQuestionToDto(entity: QuestionEntity): QuestionResponseDto {
    return {
      id: entity.id,
      text: entity.text,
      type: entity.type,
      order: entity.order,
      timeLimit: entity.timeLimit,
      required: entity.required,
      hints: entity.hints || undefined,
      createdAt: entity.createdAt,
    };
  }
}
