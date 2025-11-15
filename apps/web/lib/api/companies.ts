/**
 * Companies API Client
 * Методы для работы с Companies через API Gateway
 * 
 * TODO: Переключить на реальные API когда будут готовы эндпоинты в API Gateway
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
  createdByName?: string; // For display
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
  industry?: string;
  isActive?: boolean;
}

// ========================================
// MOCK DATA (TODO: Remove when API ready)
// ========================================

const MOCK_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'TechCorp Inc.',
    industry: 'Software Development',
    size: '50-100 employees',
    website: 'https://techcorp.com',
    description: 'Leading software development company specializing in enterprise solutions',
    location: 'San Francisco, CA',
    isActive: true,
    createdBy: 'user-hr-1',
    createdByName: 'John HR',
    createdAt: '2024-10-01T10:00:00Z',
    updatedAt: '2024-10-01T10:00:00Z',
  },
  {
    id: 'comp-2',
    name: 'AI Solutions Ltd',
    industry: 'Artificial Intelligence',
    size: '10-50 employees',
    website: 'https://ai-solutions.io',
    description: 'Cutting-edge AI and machine learning solutions for businesses',
    location: 'New York, NY',
    isActive: true,
    createdBy: 'user-hr-1',
    createdByName: 'John HR',
    createdAt: '2024-09-15T10:00:00Z',
    updatedAt: '2024-09-15T10:00:00Z',
  },
  {
    id: 'comp-3',
    name: 'CloudTech Systems',
    industry: 'Cloud Computing',
    size: '100-500 employees',
    website: 'https://cloudtech.systems',
    description: 'Enterprise cloud infrastructure and DevOps automation',
    location: 'Seattle, WA',
    isActive: true,
    createdBy: 'user-hr-2',
    createdByName: 'Sarah HR',
    createdAt: '2024-08-20T10:00:00Z',
    updatedAt: '2024-08-20T10:00:00Z',
  },
  {
    id: 'comp-4',
    name: 'Mobile Innovators',
    industry: 'Mobile Development',
    size: '10-50 employees',
    website: 'https://mobileinnovators.app',
    description: 'Cross-platform mobile app development studio',
    location: 'Austin, TX',
    isActive: true,
    createdBy: 'user-hr-1',
    createdByName: 'John HR',
    createdAt: '2024-07-10T10:00:00Z',
    updatedAt: '2024-07-10T10:00:00Z',
  },
  {
    id: 'comp-5',
    name: 'DataSphere Analytics',
    industry: 'Data Science',
    size: '50-100 employees',
    website: 'https://datasphere.ai',
    description: 'Advanced data analytics and business intelligence solutions',
    location: 'Boston, MA',
    isActive: true,
    createdBy: 'user-hr-2',
    createdByName: 'Sarah HR',
    createdAt: '2024-06-05T10:00:00Z',
    updatedAt: '2024-11-01T14:30:00Z',
  },
  {
    id: 'comp-6',
    name: 'SecureNet Inc',
    industry: 'Cybersecurity',
    size: '100-500 employees',
    website: 'https://securenet.io',
    description: 'Enterprise cybersecurity and threat intelligence',
    location: 'Washington, DC',
    isActive: true,
    createdBy: 'user-hr-3',
    createdByName: 'Mike HR',
    createdAt: '2024-05-12T10:00:00Z',
    updatedAt: '2024-05-12T10:00:00Z',
  },
  {
    id: 'comp-7',
    name: 'FinTech Ventures',
    industry: 'Financial Technology',
    size: '50-100 employees',
    website: 'https://fintechventures.com',
    description: 'Digital banking and payment solutions',
    location: 'London, UK',
    isActive: false,
    createdBy: 'user-hr-1',
    createdByName: 'John HR',
    createdAt: '2024-04-20T10:00:00Z',
    updatedAt: '2024-10-15T10:00:00Z',
  },
  {
    id: 'comp-8',
    name: 'GreenEnergy Tech',
    industry: 'Renewable Energy',
    size: '500+ employees',
    website: 'https://greenenergy.tech',
    description: 'Sustainable energy solutions and smart grid technology',
    location: 'Berlin, Germany',
    isActive: true,
    createdBy: 'user-hr-2',
    createdByName: 'Sarah HR',
    createdAt: '2024-03-08T10:00:00Z',
    updatedAt: '2024-03-08T10:00:00Z',
  },
];

let mockCompaniesData = [...MOCK_COMPANIES];

// ========================================
// HR API - Companies Management
// ========================================

/**
 * Get my companies (HR)
 * TODO: Replace with: GET /api/hr/companies
 */
export async function listCompanies(filters: CompanyFilters = {}): Promise<CompaniesListResponse> {
  // MOCK IMPLEMENTATION
  await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
  
  // In real app, backend filters by currentUserId (from JWT)
  // For mock, show all companies
  let filtered = [...mockCompaniesData];
  
  // Apply filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      c.industry.toLowerCase().includes(searchLower) ||
      c.location?.toLowerCase().includes(searchLower) ||
      c.description?.toLowerCase().includes(searchLower)
    );
  }
  
  if (filters.industry) {
    filtered = filtered.filter(c => c.industry === filters.industry);
  }
  
  if (filters.isActive !== undefined) {
    filtered = filtered.filter(c => c.isActive === filters.isActive);
  }
  
  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const start = (page - 1) * limit;
  const end = start + limit;
  const paginated = filtered.slice(start, end);
  
  return {
    data: paginated,
    pagination: {
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    },
  };
  
  // REAL API (uncomment when ready):
  // const params = new URLSearchParams();
  // if (filters.page) params.append('page', String(filters.page));
  // if (filters.limit) params.append('limit', String(filters.limit));
  // if (filters.search) params.append('search', filters.search);
  // if (filters.industry) params.append('industry', filters.industry);
  // if (filters.isActive !== undefined) params.append('isActive', String(filters.isActive));
  // return apiGet<CompaniesListResponse>(`/api/hr/companies?${params}`);
}

/**
 * Get company by ID (HR)
 * TODO: Replace with: GET /api/hr/companies/:id
 */
export async function getCompany(id: string): Promise<Company> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 200));
  const company = mockCompaniesData.find(c => c.id === id);
  if (!company) throw new Error('Company not found');
  return company;
  
  // REAL API:
  // return apiGet<Company>(`/api/hr/companies/${id}`);
}

/**
 * Create new company (HR)
 * TODO: Replace with: POST /api/hr/companies
 */
export async function createCompany(dto: CreateCompanyDto): Promise<Company> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const newCompany: Company = {
    id: `comp-${Date.now()}`,
    name: dto.name,
    industry: dto.industry,
    size: dto.size,
    website: dto.website,
    description: dto.description,
    location: dto.location,
    isActive: true,
    createdBy: 'current-user-id', // In real app from JWT
    createdByName: 'Current User',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  mockCompaniesData.push(newCompany);
  return newCompany;
  
  // REAL API:
  // return apiPost<Company>('/api/hr/companies', dto);
}

/**
 * Update company (HR - own companies only)
 * TODO: Replace with: PUT /api/hr/companies/:id
 */
export async function updateCompany(id: string, dto: UpdateCompanyDto): Promise<Company> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const index = mockCompaniesData.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Company not found');
  
  mockCompaniesData[index] = {
    ...mockCompaniesData[index],
    name: dto.name || mockCompaniesData[index].name,
    industry: dto.industry || mockCompaniesData[index].industry,
    size: dto.size || mockCompaniesData[index].size,
    website: dto.website !== undefined ? dto.website : mockCompaniesData[index].website,
    description: dto.description !== undefined ? dto.description : mockCompaniesData[index].description,
    location: dto.location !== undefined ? dto.location : mockCompaniesData[index].location,
    updatedAt: new Date().toISOString(),
  };
  
  return mockCompaniesData[index];
  
  // REAL API:
  // return apiPut<Company>(`/api/hr/companies/${id}`, dto);
}

/**
 * Toggle company active status (HR)
 * TODO: Replace with: PATCH /api/hr/companies/:id/toggle
 */
export async function toggleCompanyStatus(id: string): Promise<Company> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const index = mockCompaniesData.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Company not found');
  
  mockCompaniesData[index] = {
    ...mockCompaniesData[index],
    isActive: !mockCompaniesData[index].isActive,
    updatedAt: new Date().toISOString(),
  };
  
  return mockCompaniesData[index];
  
  // REAL API:
  // return apiPost<Company>(`/api/hr/companies/${id}/toggle`, {});
}

/**
 * Delete company (HR - own companies only)
 * TODO: Replace with: DELETE /api/hr/companies/:id
 */
export async function deleteCompany(id: string): Promise<{ success: boolean; message: string }> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 400));
  
  const index = mockCompaniesData.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Company not found');
  
  mockCompaniesData.splice(index, 1);
  
  return { success: true, message: 'Company deleted successfully' };
  
  // REAL API:
  // return apiDelete<{ success: boolean; message: string }>(`/api/hr/companies/${id}`);
}

/**
 * Get unique industries list (for filters)
 */
export async function listIndustries(): Promise<string[]> {
  // MOCK
  await new Promise(resolve => setTimeout(resolve, 100));
  const industries = Array.from(new Set(mockCompaniesData.map(c => c.industry))).sort();
  return industries;
  
  // REAL API:
  // return apiGet<string[]>('/api/hr/companies/industries');
}

/**
 * Get company sizes list (for filters)
 */
export function getCompanySizeOptions(): string[] {
  return [
    '1-10 employees',
    '10-50 employees',
    '50-100 employees',
    '100-500 employees',
    '500+ employees',
  ];
}
