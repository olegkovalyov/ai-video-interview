import { Search } from 'lucide-react';
import { SkillFilters, SkillCategory } from '../types/skill.types';

interface SkillFiltersProps {
  filters: SkillFilters;
  categories: SkillCategory[];
  onSearchChange: (search: string) => void;
  onCategoryChange: (categoryId: string) => void;
  onStatusChange: (status: 'all' | 'active' | 'inactive') => void;
}

export function SkillFiltersComponent({ 
  filters, 
  categories,
  onSearchChange, 
  onCategoryChange, 
  onStatusChange 
}: SkillFiltersProps) {
  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
          <input
            type="text"
            placeholder="Search skills..."
            value={filters.search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-md"
          />
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filters.categoryId}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-400/50 backdrop-blur-md cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map(category => (
              <option key={category.id} value={category.id} className="bg-gray-800">
                {category.name} ({category.skillsCount})
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
