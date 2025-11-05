import { InterviewTemplate } from '../aggregates/interview-template.aggregate';
import { TemplateStatus } from '../value-objects/template-status.vo';

export interface IInterviewTemplateRepository {
  /**
   * Save interview template (create or update)
   */
  save(template: InterviewTemplate): Promise<void>;

  /**
   * Find template by ID
   */
  findById(id: string): Promise<InterviewTemplate | null>;

  /**
   * Find templates created by specific user
   */
  findByCreatedBy(userId: string): Promise<InterviewTemplate[]>;

  /**
   * Find templates by status
   */
  findByStatus(status: TemplateStatus): Promise<InterviewTemplate[]>;

  /**
   * Find templates by creator and status
   */
  findByCreatedByAndStatus(
    userId: string,
    status: TemplateStatus,
  ): Promise<InterviewTemplate[]>;

  /**
   * Find all templates with pagination
   */
  findAll(
    page: number,
    limit: number,
  ): Promise<{ templates: InterviewTemplate[]; total: number }>;

  /**
   * Find templates by creator with pagination
   */
  findByCreatedByPaginated(
    userId: string,
    page: number,
    limit: number,
  ): Promise<{ templates: InterviewTemplate[]; total: number }>;

  /**
   * Delete template (soft delete - archive)
   */
  delete(id: string): Promise<void>;

  /**
   * Check if template exists
   */
  exists(id: string): Promise<boolean>;

  /**
   * Count templates by creator
   */
  countByCreatedBy(userId: string): Promise<number>;

  /**
   * Count templates by status
   */
  countByStatus(status: TemplateStatus): Promise<number>;
}
