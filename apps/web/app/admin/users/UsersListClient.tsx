'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, UserX, UserCheck, Crown, Users as UsersIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type UserRole = 'admin' | 'hr' | 'user';
type UserStatus = 'active' | 'suspended' | 'deleted';

interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
}

// Mock data - замени это на реальный API когда будет готов
const MOCK_USERS: MockUser[] = [
  {
    id: '1',
    email: 'admin@example.com',
    firstName: 'John',
    lastName: 'Admin',
    role: 'admin',
    status: 'active',
    phone: '+1 (555) 123-4567',
    createdAt: '2024-01-15T10:00:00Z',
    lastLogin: '2025-01-06T08:30:00Z',
  },
  {
    id: '2',
    email: 'hr.manager@example.com',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'hr',
    status: 'active',
    phone: '+1 (555) 234-5678',
    createdAt: '2024-02-20T11:00:00Z',
    lastLogin: '2025-01-05T14:15:00Z',
  },
  {
    id: '3',
    email: 'candidate@example.com',
    firstName: 'Michael',
    lastName: 'Smith',
    role: 'user',
    status: 'active',
    createdAt: '2024-03-10T12:00:00Z',
    lastLogin: '2025-01-04T16:45:00Z',
  },
  {
    id: '4',
    email: 'jane.doe@example.com',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'user',
    status: 'suspended',
    phone: '+1 (555) 345-6789',
    createdAt: '2024-04-05T13:00:00Z',
    lastLogin: '2024-12-20T11:30:00Z',
  },
  {
    id: '5',
    email: 'hr.assistant@example.com',
    firstName: 'Emily',
    lastName: 'Brown',
    role: 'hr',
    status: 'active',
    createdAt: '2024-05-12T14:00:00Z',
    lastLogin: '2025-01-05T10:00:00Z',
  },
  {
    id: '6',
    email: 'bob.wilson@example.com',
    firstName: 'Bob',
    lastName: 'Wilson',
    role: 'user',
    status: 'active',
    createdAt: '2024-06-18T15:00:00Z',
    lastLogin: '2025-01-03T09:20:00Z',
  },
];

export function UsersListClient() {
  const [users, setUsers] = useState<MockUser[]>(MOCK_USERS);
  const [filteredUsers, setFilteredUsers] = useState<MockUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');

  // Apply filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (search) {
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(search.toLowerCase()) ||
          user.lastName.toLowerCase().includes(search.toLowerCase()) ||
          user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  }, [search, roleFilter, statusFilter, users]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (user: MockUser) => {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  const getRoleBadge = (role: UserRole) => {
    const styles = {
      admin: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
      hr: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
      user: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
    };
    const labels = {
      admin: 'Admin',
      hr: 'HR',
      user: 'User',
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${styles[role]}`}>
        {role === 'admin' && <Crown className="w-3 h-3" />}
        {labels[role]}
      </span>
    );
  };

  const getStatusBadge = (status: UserStatus) => {
    const styles = {
      active: 'bg-green-500/20 text-green-200 border-green-500/30',
      suspended: 'bg-red-500/20 text-red-200 border-red-500/30',
      deleted: 'bg-gray-500/20 text-gray-200 border-gray-500/30',
    };
    return (
      <span className={`inline-block px-2 py-1 text-xs rounded-full border ${styles[status]}`}>
        {status === 'active' ? 'Active' : status === 'suspended' ? 'Suspended' : 'Deleted'}
      </span>
    );
  };

  const handleSuspendUser = (userId: string) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' as UserStatus } : u
    ));
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers(users.map(u => 
        u.id === userId ? { ...u, status: 'deleted' as UserStatus } : u
      ));
    }
  };

  const handleChangeRole = (userId: string, newRole: UserRole) => {
    setUsers(users.map(u => 
      u.id === userId ? { ...u, role: newRole } : u
    ));
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    suspended: users.filter(u => u.status === 'suspended').length,
    admins: users.filter(u => u.role === 'admin').length,
    hrs: users.filter(u => u.role === 'hr').length,
  };

  return (
    <>
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="text-white/70 text-sm">Total Users</div>
            <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="text-white/70 text-sm">Active</div>
            <div className="text-2xl font-bold text-green-300 mt-1">{stats.active}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="text-white/70 text-sm">Suspended</div>
            <div className="text-2xl font-bold text-red-300 mt-1">{stats.suspended}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="text-white/70 text-sm">Admins</div>
            <div className="text-2xl font-bold text-purple-300 mt-1">{stats.admins}</div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4">
            <div className="text-white/70 text-sm">HR Managers</div>
            <div className="text-2xl font-bold text-blue-300 mt-1">{stats.hrs}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
              />
            </div>

            {/* Role Filter */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
              className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="hr">HR</option>
              <option value="user">User</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as UserStatus | 'all')}
              className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
            </select>

            {/* Create Button */}
            <Button variant="brand" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create User
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
      </div>

      {/* Users Table */}
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
                {filteredUsers.map((user) => (
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
                          {user.phone && (
                            <div className="text-white/60 text-xs">{user.phone}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-white/80">{user.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(user.role)}
                        <select
                          value={user.role}
                          onChange={(e) => handleChangeRole(user.id, e.target.value as UserRole)}
                          className="text-xs bg-white/10 border border-white/30 rounded px-2 py-1 text-white"
                        >
                          <option value="admin">Admin</option>
                          <option value="hr">HR</option>
                          <option value="user">User</option>
                        </select>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(user.status)}</td>
                    <td className="p-4 text-white/80 text-sm">
                      {user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSuspendUser(user.id)}
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
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={user.status === 'deleted'}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                        <button
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4 text-blue-400" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No users found</h3>
              <p className="text-white/70">
                {search || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search filters'
                  : 'No users in the system yet'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <div className="mt-4 text-sm text-white/60">
        💡 This is a demo version with hardcoded data. Full functionality will be available after API integration.
      </div>
    </>
  );
}
