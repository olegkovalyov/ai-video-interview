'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CompaniesTable } from './CompaniesTable';
import { useCompanies, useDeleteCompany } from '@/lib/query/hooks/use-companies';
import { Search } from 'lucide-react';

export function CompaniesList() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { data, isPending, isFetching } = useCompanies({ search: debouncedSearch || undefined });
  const deleteMutation = useDeleteCompany();

  const companies = data?.data ?? [];
  const loadingCompanies = new Set(
    deleteMutation.isPending && deleteMutation.variables ? [deleteMutation.variables] : [],
  );

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle edit
  const handleEdit = (companyId: string) => {
    router.push(`/hr/companies/${companyId}/edit`);
  };

  // Handle delete
  const handleDelete = (companyId: string) => {
    const company = companies.find(c => c.id === companyId);
    if (!company) return;

    if (!confirm(`Are you sure you want to delete "${company.name}"? This action cannot be undone.`)) {
      return;
    }

    deleteMutation.mutate(companyId);
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
            aria-label="Search companies"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
          />
          {isFetching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white/80 rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Results Count */}
      {!isPending && (
        <div className="mb-4 text-white/80" aria-live="polite">
          Found {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
        </div>
      )}

      <CompaniesTable
        companies={companies}
        onEdit={handleEdit}
        onDelete={handleDelete}
        loadingCompanies={loadingCompanies}
      />
    </>
  );
}
