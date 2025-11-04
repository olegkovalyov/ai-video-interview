import { Edit2, Trash2, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { User } from '../types/user.types';
import { UserRoleBadge, UserStatusBadge } from './UserBadges';
import { formatDate, getInitials } from '../utils/user-helpers';

interface UsersTableProps {
  users: User[];
  onStatusToggle: (userId: string) => void;
  onDelete: (userId: string) => void;
  onEdit?: (userId: string) => void;
  loadingUsers?: Set<string>;
}

export function UsersTable({ users, onStatusToggle, onDelete, onEdit, loadingUsers = new Set() }: UsersTableProps) {
  if (users.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-0">
          <div className="p-12 text-center">
            <UsersIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
            <p className="text-white/70">Try adjusting your search filters</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-white/20">
              <tr>
                <th className="text-left p-4 text-white/70 font-semibold">User</th>
                <th className="text-left p-4 text-white/70 font-semibold">Email</th>
                <th className="text-left p-4 text-white/70 font-semibold">Role</th>
                <th className="text-left p-4 text-white/70 font-semibold">Status</th>
                <th className="text-left p-4 text-white/70 font-semibold">Last Login</th>
                <th className="text-right p-4 text-white/70 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isLoading = loadingUsers.has(user.id);
                return (
                <tr 
                  key={user.id} 
                  className={`
                    border-b border-white/10 hover:bg-white/5 transition-all duration-200
                    ${isLoading ? 'opacity-60 blur-[0.5px]' : ''}
                  `}
                >
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        {getInitials(user)}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {user.firstName} {user.lastName}
                        </div>
                        {user.phone && <div className="text-white/60 text-xs">{user.phone}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-white/80">{user.email}</td>
                  <td className="p-4">
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <UserStatusBadge status={user.status} />
                      {/* Toggle Switch */}
                      <button
                        onClick={() => onStatusToggle(user.id)}
                        disabled={isLoading || user.status === 'deleted'}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${isLoading || user.status === 'deleted' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                          ${user.status === 'active' ? 'bg-green-500' : 'bg-gray-600'}
                        `}
                        title={user.status === 'active' ? 'Click to suspend' : 'Click to activate'}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${user.status === 'active' ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  </td>
                  <td className="p-4 text-white/80 text-sm">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onDelete(user.id)}
                        disabled={isLoading || user.status === 'deleted'}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(user.id)}
                          disabled={isLoading}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
