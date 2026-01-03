import { AnalysisResultResponse } from './analysis-result.response';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AnalysisListResponse {
  items: AnalysisResultResponse[];
  meta: PaginationMeta;
}
