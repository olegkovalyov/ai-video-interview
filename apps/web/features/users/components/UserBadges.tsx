import { Crown } from 'lucide-react';
import { UserRole, UserStatus } from '../types/user.types';

interface UserRoleBadgeProps {
  role: UserRole;
}

export function UserRoleBadge({ role }: UserRoleBadgeProps) {
  const styles = {
    admin: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    hr: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    candidate: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
  };
  
  const labels = {
    admin: 'Admin',
    hr: 'HR',
    candidate: 'Candidate',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${styles[role]}`}>
      {role === 'admin' && <Crown className="w-3 h-3" />}
      {labels[role]}
    </span>
  );
}

interface UserStatusBadgeProps {
  status: UserStatus;
}

export function UserStatusBadge({ status }: UserStatusBadgeProps) {
  const styles = {
    active: 'bg-green-500/20 text-green-200 border-green-500/30',
    suspended: 'bg-red-500/20 text-red-200 border-red-500/30',
    deleted: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
  };

  const labels = {
    active: 'Active',
    suspended: 'Suspended',
    deleted: 'Deleted',
  };

  return (
    <span className={`inline-block px-2 py-1 text-xs rounded-full border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
