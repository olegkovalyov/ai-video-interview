/**
 * Companies Feature Types
 */

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
  createdByName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyStats {
  total: number;
  active: number;
  inactive: number;
  totalIndustries: number;
}

export interface CompanyFilters {
  search: string;
  industry: string;
  status: 'all' | 'active' | 'inactive';
}
