import { Search, Filter } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CandidateFilters as CandidateFiltersType, CandidateStatus } from '../types/candidate.types';

interface CandidateFiltersProps {
  filters: CandidateFiltersType;
  interviews: string[];
  onSearchChange: (search: string) => void;
  onStatusChange: (status: CandidateStatus | 'all') => void;
  onInterviewChange: (interview: string | 'all') => void;
}

export function CandidateFilters({
  filters,
  interviews,
  onSearchChange,
  onStatusChange,
  onInterviewChange,
}: CandidateFiltersProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-8">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search candidates by name, email, position..."
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onStatusChange(e.target.value as CandidateStatus | 'all')}
            className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
          </select>

          {/* Interview Filter */}
          <select
            value={filters.interview}
            onChange={(e) => onInterviewChange(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer"
          >
            <option value="all">All Interviews</option>
            {interviews.map((interview) => (
              <option key={interview} value={interview}>
                {interview}
              </option>
            ))}
          </select>

          <button className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-lg flex items-center space-x-2 transition-colors cursor-pointer">
            <Filter className="w-5 h-5" />
            <span>More Filters</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
