'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompanyStatsCards } from './CompanyStatsCards';
import { CompanyFiltersComponent } from './CompanyFilters';
import { CompaniesTable } from './CompaniesTable';
import { listCompanies, listIndustries, toggleCompanyStatus, deleteCompany, type Company } from '@/lib/api/companies';
import { toast } from 'sonner';

export function CompaniesList() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [industries, setIndustries] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState<Set<string>>(new Set());
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Fetch companies and industries
  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [companiesResponse, industriesData] = await Promise.all([
        listCompanies({
          search: searchQuery || undefined,
          industry: industryFilter || undefined,
          isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
        }),
        listIndustries(),
      ]);
      
      setCompanies(companiesResponse.data);
      setIndustries(industriesData);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchQuery, industryFilter, statusFilter]);

  // Row-level locking helper
  const withCompanyLock = async <T,>(companyId: string, action: () => Promise<T>): Promise<T | void> => {
    setLoadingCompanies(prev => new Set(prev).add(companyId));
    try {
      const result = await action();
      await fetchData(); // Refresh data
      return result;
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoadingCompanies(prev => {
        const next = new Set(prev);
        next.delete(companyId);
        return next;
      });
    }
  };

  // Handle status toggle
  const handleToggleStatus = async (companyId: string) => {
    await withCompanyLock(companyId, async () => {
      await toggleCompanyStatus(companyId);
      toast.success('Company status updated');
    });
  };

  // Handle edit
  const handleEdit = (companyId: string) => {
    router.push(`/hr/companies/${companyId}/edit`);
  };

  // Handle delete
  const handleDelete = async (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    if (!confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
      return;
    }

    await withCompanyLock(companyId, async () => {
      await deleteCompany(companyId);
      toast.success('Company deleted');
    });
  };

  // Calculate stats
  const stats = {
    total: companies.length,
    active: companies.filter(c => c.isActive).length,
    inactive: companies.filter(c => !c.isActive).length,
    totalIndustries: industries.length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/80">Loading companies...</div>
      </div>
    );
  }

  return (
    <>
      <CompanyStatsCards stats={stats} />

      <CompanyFiltersComponent
        filters={{ search: searchQuery, industry: industryFilter, status: statusFilter }}
        industries={industries}
        onSearchChange={setSearchQuery}
        onIndustryChange={setIndustryFilter}
        onStatusChange={setStatusFilter}
      />

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
        {(industryFilter || statusFilter !== 'all') && (
          <span className="ml-2 text-white/60">
            (filtered)
          </span>
        )}
      </div>

      <CompaniesTable
        companies={companies}
        onToggleStatus={handleToggleStatus}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loadingCompanies={loadingCompanies}
      />
    </>
  );
}
