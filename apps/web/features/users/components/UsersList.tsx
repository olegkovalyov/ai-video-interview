'use client';

import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { UserStatsCards } from './UserStatsCards';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';
import { useUsers, useSuspendUser, useActivateUser, useDeleteUser } from '@/lib/query/hooks/use-users';
import { getUserRoles } from '@/lib/api/users';
import { userKeys } from '@/lib/query/query-keys';
import { toast } from 'sonner';

export function UsersList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'hr' | 'candidate'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'deleted'>('all');

  // Main users query
  const { data: users = [], isPending } = useUsers({ search: searchQuery });

  // Parallel role queries for each user
  const roleQueries = useQueries({
    queries: users.map(user => ({
      queryKey: userKeys.roles(user.id),
      queryFn: () => getUserRoles(user.id),
      staleTime: 5 * 60_000,
      enabled: users.length > 0,
    })),
  });

  const rolesLoading = roleQueries.some(q => q.isPending);

  // Build roles map from query results
  const userRoles = useMemo(() => {
    const map = new Map<string, string>();
    users.forEach((user, i) => {
      const roles = roleQueries[i]?.data;
      if (roles) {
        const primaryRole = roles.find(r =>
          ['admin', 'hr', 'candidate'].includes(r.name.toLowerCase())
        );
        map.set(user.id, primaryRole?.name.toLowerCase() || 'candidate');
      } else {
        map.set(user.id, 'candidate');
      }
    });
    return map;
  }, [users, roleQueries]);

  // Mutations
  const suspendMutation = useSuspendUser();
  const activateMutation = useActivateUser();
  const deleteMutation = useDeleteUser();

  // Compute loading users from active mutations
  const loadingUsers = new Set<string>(
    [suspendMutation, activateMutation, deleteMutation]
      .filter(m => m.isPending && m.variables)
      .map(m => m.variables as string)
  );

  // Handle status toggle
  const handleStatusToggle = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    if (user.enabled) {
      suspendMutation.mutate(userId);
    } else {
      activateMutation.mutate(userId);
    }
  };

  // Handle delete
  const handleDelete = (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    deleteMutation.mutate(userId);
  };

  // Convert KeycloakUser to User format for table
  const mappedUsers = users
    .map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      role: (userRoles.get(u.id) || 'candidate') as any,
      status: u.enabled ? 'active' as const : 'suspended' as const,
      lastLogin: u.lastLoginAt || undefined,
      phone: undefined,
      createdAt: u.createdTimestamp ? new Date(u.createdTimestamp).toISOString() : new Date().toISOString(),
    }))
    // Apply role filter
    .filter(user => {
      if (roleFilter === 'all') return true;
      return user.role === roleFilter;
    })
    // Apply status filter
    .filter(user => {
      if (statusFilter === 'all') return true;
      return user.status === statusFilter;
    });

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.enabled).length,
    suspended: users.filter(u => !u.enabled).length,
    admins: Array.from(userRoles.values()).filter(role => role === 'admin').length,
    hrs: Array.from(userRoles.values()).filter(role => role === 'hr').length,
  };

  if (isPending || rolesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white/80">Loading users...</div>
      </div>
    );
  }

  return (
    <>
      <UserStatsCards stats={stats} />

      <UserFilters
        filters={{ search: searchQuery, role: roleFilter, status: statusFilter }}
        onSearchChange={setSearchQuery}
        onRoleChange={(role) => setRoleFilter(role)}
        onStatusChange={(status) => setStatusFilter(status)}
      />

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {mappedUsers.length} user{mappedUsers.length !== 1 ? 's' : ''}
        {(roleFilter !== 'all' || statusFilter !== 'all') && (
          <span className="ml-2 text-white/60">
            (filtered from {users.length} total)
          </span>
        )}
      </div>

      <UsersTable
        users={mappedUsers}
        onStatusToggle={handleStatusToggle}
        onDelete={handleDelete}
        loadingUsers={loadingUsers}
      />
    </>
  );
}
