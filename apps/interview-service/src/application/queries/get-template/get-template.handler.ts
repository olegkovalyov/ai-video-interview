import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetTemplateQuery } from './get-template.query';
import { TemplateResponseDto } from '../../dto/template.response.dto';
import { IInterviewTemplateReadRepository } from '../../../domain/repositories/interview-template-read.repository.interface';
import { TemplateNotFoundException, TemplateUnauthorizedException } from '../../../domain/exceptions/interview-template.exceptions';
import { LoggerService } from '../../../infrastructure/logger/logger.service';

@QueryHandler(GetTemplateQuery)
export class GetTemplateHandler implements IQueryHandler<GetTemplateQuery> {
  constructor(
    @Inject('IInterviewTemplateReadRepository')
    private readonly readRepository: IInterviewTemplateReadRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(query: GetTemplateQuery): Promise<TemplateResponseDto> {
    this.logger.info(`Getting template: ${query.templateId}`);

    // Load template directly from Read Repository (no aggregate!)
    const template = await this.readRepository.findById(query.templateId);

    if (!template) {
      throw new TemplateNotFoundException(query.templateId);
    }

    // RBAC: HR can only see their own templates, Admin sees all
    if (query.userRole === 'hr' && query.userId) {
      if (template.createdBy !== query.userId) {
        throw new TemplateUnauthorizedException(query.userId, query.templateId);
      }
    }

    return template;
  }
}
