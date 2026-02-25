import { AnalysisResult } from '../aggregates/analysis-result.aggregate';
import { AnalysisStatusEnum } from '../value-objects/analysis-status.vo';

export interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: AnalysisStatusEnum;
  candidateId?: string;
  templateId?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const ANALYSIS_RESULT_REPOSITORY = Symbol('IAnalysisResultRepository');

export interface IAnalysisResultRepository {
  save(analysisResult: AnalysisResult, sourceEventData?: Record<string, unknown>): Promise<void>;

  findById(id: string): Promise<AnalysisResult | null>;

  findByInvitationId(invitationId: string): Promise<AnalysisResult | null>;

  findAll(options: FindAllOptions): Promise<PaginatedResult<AnalysisResult>>;

  existsByInvitationId(invitationId: string): Promise<boolean>;

  delete(id: string): Promise<void>;

  /** Store original Kafka event data for retry purposes */
  saveSourceEventData(analysisId: string, data: Record<string, unknown>): Promise<void>;

  /** Retrieve stored event data for retry */
  getSourceEventData(analysisId: string): Promise<Record<string, unknown> | null>;
}
