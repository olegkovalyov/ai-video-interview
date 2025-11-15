/**
 * Common types shared across all features
 */

export interface PaginationDto {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
