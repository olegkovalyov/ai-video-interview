import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { GetTemplateQuery } from './get-template.query';
import { TemplateResponseDto } from '../../dto/template.response.dto';
import { InterviewTemplateReadRepository } from '../../../infrastructure/persistence/repositories/interview-template-read.repository';

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<GetTemplateQuery> {
  private readonly logger = new Logger(GetTemplateHandler.name);

  constructor(
    private readonly readRepository: InterviewTemplateReadRepository,
  ) {}

  async execute(query: GetTemplateQuery): Promise<TemplateResponseDto> {
    this.logger.log(`Getting template: ${query.templateId}`);

    // Load template directly from Read Repository (no aggregate!)
    const template = await this.readRepository.findById(query.templateId);
    
    if (!template) {
      throw new NotFoundException(
        `Template with ID ${query.templateId} not found`,
      );
    }

    // RBAC: HR can only see their own templates, Admin sees all
    if (query.userRole === 'hr' && query.userId) {
      if (template.createdBy !== query.userId) {
        throw new ForbiddenException(
          'You do not have permission to view this template',
        );
      }
    }

    return template;
  }
}
