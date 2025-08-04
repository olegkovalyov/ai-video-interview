export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterQuery {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}

export type UUID = string;

export interface TimestampedEntity {
  createdAt: Date;
  updatedAt: Date;
}

export interface SoftDeletableEntity extends TimestampedEntity {
  deletedAt?: Date;
}
