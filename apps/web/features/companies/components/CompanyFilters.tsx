import { Search } from 'lucide-react';
import { CompanyFilters } from '../types/company.types';

interface CompanyFiltersProps {
  filters: CompanyFilters;
  industries: string[];
  onSearchChange: (search: string) => void;
  onIndustryChange: (industry: string) => void;
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
}

export function CompanyFiltersComponent({ 
  filters, 
  industries,
  onSearchChange, 
  onIndustryChange, 
  onStatusChange 
}: CompanyFiltersProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <input
            type="text"
            placeholder="Search companies..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-md"
          />
        </div>

        {/* Industry Filter */}
        <div>
          <select
            value={filters.industry}
            onChange={(e) => onIndustryChange(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-md cursor-pointer"
          >
            <option value="">All Industries</option>
            {industries.map(industry => (
              <option key={industry} value={industry} className="bg-gray-800">
                {industry}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status}
            onChange={(e) => onStatusChange(e.target.value as 'all' | 'active' | 'inactive')}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-md cursor-pointer"
          >
            <option value="all" className="bg-gray-800">All Status</option>
            <option value="active" className="bg-gray-800">Active Only</option>
            <option value="inactive" className="bg-gray-800">Inactive Only</option>
          </select>
        </div>
      </div>
    </div>
  );
}
