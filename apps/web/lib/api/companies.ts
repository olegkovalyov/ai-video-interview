/**
 * Companies API Client
 * Методы для работы с Companies через API Gateway
 */

import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

// ========================================
// TYPES
// ========================================

export interface Company {
  id: string;
  name: string;
  industry: string;
  size: string;
  website?: string;
  description?: string;
  location?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompaniesListResponse {
  data: Company[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CreateCompanyDto {
  name: string;
  industry: string;
  size: string;
  website?: string;
  description?: string;
  location?: string;
}

export interface UpdateCompanyDto {
  name?: string;
  industry?: string;
  size?: string;
  website?: string;
  description?: string;
  location?: string;
}

export interface CompanyFilters {
  page?: number;
  limit?: number;
  search?: string;
}

// ========================================
// HR API - Companies Management
// ========================================

/**
 * Get my companies (HR)
 * GET /api/hr/companies
 */
export async function listCompanies(filters: CompanyFilters = {}): Promise<CompaniesListResponse> {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.search) params.append('search', filters.search);
  
  const queryString = params.toString();
  const url = queryString ? `/api/hr/companies?${queryString}` : '/api/hr/companies';
  
  return apiGet<CompaniesListResponse>(url);
}

/**
 * Get company by ID (HR)
 * GET /api/hr/companies/:id
 */
export async function getCompany(id: string): Promise<Company> {
  return apiGet<Company>(`/api/hr/companies/${id}`);
}

/**
 * Create new company (HR)
 * POST /api/hr/companies
 */
export async function createCompany(dto: CreateCompanyDto): Promise<Company> {
  return apiPost<Company>('/api/hr/companies', dto);
}

/**
 * Update company (HR - own companies only)
 * PUT /api/hr/companies/:id
 */
export async function updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
  return apiPut<Company>(`/api/hr/companies/${id}`, dto);
}

/**
 * Delete company (HR - own companies only)
 * DELETE /api/hr/companies/:id
 */
export async function deleteCompany(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/api/hr/companies/${id}`);
}

/**
 * Get company sizes list (for forms)
 * Must match user-service CompanySize enum: 1-10, 11-50, 51-200, 200+
 */
export function getCompanySizeOptions(): string[] {
  return [
    '1-10',
    '11-50',
    '51-200',
    '200+',
  ];
}
