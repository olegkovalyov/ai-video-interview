import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { ListTemplatesQuery } from './list-templates.query';
import { PaginatedTemplatesResponseDto } from '../../dto/template.response.dto';
import type { IInterviewTemplateReadRepository } from '../../../domain/repositories/interview-template-read.repository.interface';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

@QueryHandler(ListTemplatesQuery)
export class ListTemplatesHandler
  implements IQueryHandler<ListTemplatesQuery>
{
  constructor(
    @Inject('IInterviewTemplateReadRepository')
    private readonly readRepository: IInterviewTemplateReadRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    query: ListTemplatesQuery,
  ): Promise<PaginatedTemplatesResponseDto> {
    this.logger.info(
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
