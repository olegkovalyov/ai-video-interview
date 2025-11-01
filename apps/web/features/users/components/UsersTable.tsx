import { Edit2, Trash2, UserX, UserCheck, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { User, UserRole } from '../types/user.types';
import { UserRoleBadge, UserStatusBadge } from './UserBadges';
import { formatDate, getInitials } from '../utils/user-helpers';

interface UsersTableProps {
  users: User[];
  onRoleChange: (userId: string, newRole: UserRole) => void;
  onStatusToggle: (userId: string) => void;
  onDelete: (userId: string) => void;
  onEdit?: (userId: string) => void;
}

export function UsersTable({ users, onRoleChange, onStatusToggle, onDelete, onEdit }: UsersTableProps) {
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
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/10 hover:bg-white/5 transition-colors">
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
                    <div className="flex items-center gap-2">
                      <UserRoleBadge role={user.role} />
                      <select
                        value={user.role}
                        onChange={(e) => onRoleChange(user.id, e.target.value as UserRole)}
                        className="text-xs bg-white/10 border border-white/30 rounded px-2 py-1 text-white"
                      >
                        <option value="admin">Admin</option>
                        <option value="hr">HR</option>
                        <option value="user">User</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <UserStatusBadge status={user.status} />
                  </td>
                  <td className="p-4 text-white/80 text-sm">
                    {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onStatusToggle(user.id)}
                        disabled={user.status === 'deleted'}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={user.status === 'active' ? 'Suspend' : 'Activate'}
                      >
                        {user.status === 'active' ? (
                          <UserX className="w-4 h-4 text-red-400" />
                        ) : (
                          <UserCheck className="w-4 h-4 text-green-400" />
                        )}
                      </button>
                      <button
                        onClick={() => onDelete(user.id)}
                        disabled={user.status === 'deleted'}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(user.id)}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
