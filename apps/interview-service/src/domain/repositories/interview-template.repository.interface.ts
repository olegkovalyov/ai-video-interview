import { InterviewTemplate } from '../aggregates/interview-template.aggregate';
import { TemplateStatus } from '../value-objects/template-status.vo';
import type { ITransactionContext } from '../../application/interfaces/transaction-context.interface';

export interface IInterviewTemplateRepository {
  /**
   * Save interview template (create or update)
   */
  save(template: InterviewTemplate, tx?: ITransactionContext): Promise<void>;

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
   * Find all templates with filters and pagination
   */
  findAll(
    filters: {
      createdBy?: string;
      status?: string;
    },
    skip: number,
    limit: number,
  ): Promise<{ templates: InterviewTemplate[]; total: number }>;

  /**
   * Delete template (soft delete - archive)
   */
  delete(id: string, tx?: ITransactionContext): Promise<void>;

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

  /**
   * Reorder questions in template (batch update)
   * Uses single SQL query with CASE WHEN for performance
   */
  reorderQuestions(templateId: string, questionIds: string[], tx?: ITransactionContext): Promise<void>;
}
