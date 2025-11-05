import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { ListTemplatesQuery } from './list-templates.query';
import type { IInterviewTemplateRepository } from '../../../domain/repositories/interview-template.repository.interface';
import { 
  PaginatedTemplatesResponseDto, 
  TemplateListItemDto 
} from '../../dto/template.response.dto';

@QueryHandler(ListTemplatesQuery)
export class ListTemplatesHandler
  implements IQueryHandler<ListTemplatesQuery>
{
  private readonly logger = new Logger(ListTemplatesHandler.name);

  constructor(
    @Inject('IInterviewTemplateRepository')
    private readonly templateRepository: IInterviewTemplateRepository,
  ) {}

  async execute(
    query: ListTemplatesQuery,
  ): Promise<PaginatedTemplatesResponseDto> {
    this.logger.log(
      `Listing templates - page: ${query.page}, limit: ${query.limit}`,
    );

    // Build filters
    const filters: any = {};

    // RBAC: HR sees only their templates, Admin sees all
    if (query.userRole === 'hr' && query.userId) {
      filters.createdBy = query.userId;
    }

    // Status filter
    if (query.status) {
      filters.status = query.status;
    }

    // Pagination
    const skip = (query.page - 1) * query.limit;

    // Load templates with pagination
    const { templates, total } = await this.templateRepository.findAll(
      filters,
      skip,
      query.limit,
    );

    // Map to DTOs
    const items: TemplateListItemDto[] = templates.map((template) => ({
      id: template.id,
      title: template.title,
      description: template.description,
      status: template.status.toString(),
      createdBy: template.createdBy,
      questionsCount: template.getQuestionsCount(),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

    const totalPages = Math.ceil(total / query.limit);

    return {
      items,
      total,
      page: query.page,
      limit: query.limit,
      totalPages,
    };
  }
}
