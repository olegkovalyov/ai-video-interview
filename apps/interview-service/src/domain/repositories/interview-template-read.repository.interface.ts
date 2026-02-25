import type {
  TemplateResponseDto,
  PaginatedTemplatesResponseDto,
} from '../../application/dto/template.response.dto';
import type { QuestionResponseDto } from '../../application/dto/question.response.dto';

/**
 * Read Repository Interface for Interview Templates (Query side — CQRS)
 * Returns DTOs directly, bypassing aggregate reconstitution for performance.
 */
export interface IInterviewTemplateReadRepository {
  findById(id: string): Promise<TemplateResponseDto | null>;
  findAll(
    filters: { createdBy?: string; status?: string },
    skip: number,
    limit: number,
  ): Promise<PaginatedTemplatesResponseDto>;
  findQuestions(templateId: string): Promise<QuestionResponseDto[]>;
  exists(id: string): Promise<boolean>;
}
