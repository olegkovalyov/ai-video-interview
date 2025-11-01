import { Search, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserFilters as UserFiltersType, UserRole, UserStatus } from '../types/user.types';

interface UserFiltersProps {
  filters: UserFiltersType;
  onSearchChange: (search: string) => void;
  onRoleChange: (role: UserRole | 'all') => void;
  onStatusChange: (status: UserStatus | 'all') => void;
  onCreateClick?: () => void;
}

export function UserFilters({
  filters,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onCreateClick,
}: UserFiltersProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => onRoleChange(e.target.value as UserRole | 'all')}
            className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="hr">HR</option>
            <option value="user">User</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => onStatusChange(e.target.value as UserStatus | 'all')}
            className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>

          {/* Create Button */}
          {onCreateClick && (
            <Button variant="brand" onClick={onCreateClick} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create User
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
