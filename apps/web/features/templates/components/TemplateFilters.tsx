import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TemplateStatus } from '../types/template.types';

interface TemplateFiltersProps {
  search: string;
  status: TemplateStatus | 'all';
  onSearchChange: (search: string) => void;
  onStatusChange: (status: TemplateStatus | 'all') => void;
  onCreateClick: () => void;
}

export function TemplateFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
  onCreateClick,
}: TemplateFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      {/* Search */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
        />
      </div>

      {/* Status filter */}
      <select
        value={status}
        onChange={(e) => onStatusChange(e.target.value as TemplateStatus | 'all')}
        className="px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="draft">Draft</option>
        <option value="archived">Archived</option>
      </select>

      {/* Create button */}
      <button
        onClick={onCreateClick}
        className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl whitespace-nowrap cursor-pointer"
      >
        + Create Template
      </button>
    </div>
  );
}
