import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { ListTemplatesQuery } from './list-templates.query';
import { PaginatedTemplatesResponseDto } from '../../dto/template.response.dto';
import { InterviewTemplateReadRepository } from '../../../infrastructure/persistence/repositories/interview-template-read.repository';

@QueryHandler(ListTemplatesQuery)
export class ListTemplatesHandler
  implements IQueryHandler<ListTemplatesQuery>
{
  private readonly logger = new Logger(ListTemplatesHandler.name);

  constructor(
    private readonly readRepository: InterviewTemplateReadRepository,
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

    // Load templates with pagination (no aggregates!)
    return this.readRepository.findAll(filters, skip, query.limit);
  }
}
