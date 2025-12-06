'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CompaniesTable } from './CompaniesTable';
import { listCompanies, deleteCompany, type Company } from '@/lib/api/companies';
import { toast } from 'sonner';
import { Search } from 'lucide-react';

export function CompaniesList() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingCompanies, setLoadingCompanies] = useState<Set<string>>(new Set());
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(value);
    }, 400);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  // Fetch companies
  const fetchData = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const response = await listCompanies({
        search: search || undefined,
      });
      setCompanies(response.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(debouncedSearch);
  }, [debouncedSearch, fetchData]);

  // Row-level locking helper
  const withCompanyLock = async <T,>(companyId: string, action: () => Promise<T>): Promise<T | void> => {
    setLoadingCompanies(prev => new Set(prev).add(companyId));
    try {
      const result = await action();
      await fetchData(debouncedSearch); // Refresh data
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

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder="Search companies..."
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
      </div>

      <CompaniesTable
        companies={companies}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loadingCompanies={loadingCompanies}
      />
    </>
  );
}
