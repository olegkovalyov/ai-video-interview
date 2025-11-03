'use client';

import { useState, useEffect } from 'react';
import { UserStatsCards } from './UserStatsCards';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';
import { listUsers, assignRole, removeRole, suspendUser, activateUser, deleteUser, getUserRoles, type KeycloakUser } from '@/lib/api/users';
import { toast } from 'sonner';

export function UsersList() {
  const [users, setUsers] = useState<KeycloakUser[]>([]);
  const [userRoles, setUserRoles] = useState<Map<string, string>>(new Map()); // userId -> roleName
  const [loading, setLoading] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users with their roles
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await listUsers({ search: searchQuery, max: 100 });
      setUsers(data);

      // Fetch roles for each user
      const rolesMap = new Map<string, string>();
      await Promise.all(
        data.map(async (user) => {
          try {
            const roles = await getUserRoles(user.id);
            // Get first role (users should have only one primary role)
            const primaryRole = roles.find(r =>
              ['admin', 'hr', 'candidate'].includes(r.name.toLowerCase())
            );
            if (primaryRole) {
              rolesMap.set(user.id, primaryRole.name.toLowerCase());
            } else {
              rolesMap.set(user.id, 'candidate'); // default
            }
          } catch (error) {
            console.error(`Failed to fetch roles for user ${user.id}:`, error);
            rolesMap.set(user.id, 'candidate'); // default on error
          }
        })
      );
      setUserRoles(rolesMap);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchQuery]);

  // Row-level locking helper
  const withUserLock = async <T,>(userId: string, action: () => Promise<T>): Promise<T | void> => {
    setLoadingUsers(prev => new Set(prev).add(userId));
    try {
      const result = await action();
      await fetchUsers(); // Refresh data
      return result;
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoadingUsers(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  // Handle role change
  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentRole = userRoles.get(userId) || 'candidate';
    if (currentRole === newRole) {
      return; // No change needed
    }

    await withUserLock(userId, async () => {
      // Remove old role if exists
      if (currentRole) {
        try {
          await removeRole(userId, currentRole);
        } catch (error) {
          console.error('Failed to remove old role:', error);
        }
      }

      // Assign new role
      await assignRole(userId, newRole);

      // Update local state immediately
      setUserRoles(prev => {
        const next = new Map(prev);
        next.set(userId, newRole);
        return next;
      });

      toast.success(`Role updated to ${newRole}`);
    });
  };

  // Handle status toggle
  const handleStatusToggle = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    await withUserLock(userId, async () => {
      if (user.enabled) {
        await suspendUser(userId);
        toast.success('User suspended');
      } else {
        await activateUser(userId);
        toast.success('User activated');
      }
    });
  };

  // Handle delete
  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    await withUserLock(userId, async () => {
      await deleteUser(userId);
      toast.success('User deleted');
    });
  };

  // Convert KeycloakUser to User format for table
  const mappedUsers = users.map(u => ({
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    role: (userRoles.get(u.id) || 'candidate') as any,
    status: u.enabled ? 'active' as const : 'suspended' as const,
    lastLogin: u.lastLoginAt || undefined,
    phone: undefined,
    createdAt: u.createdTimestamp ? new Date(u.createdTimestamp).toISOString() : new Date().toISOString(),
  }));

  // Calculate stats
  const stats = {
    total: users.length,
    active: users.filter(u => u.enabled).length,
    suspended: users.filter(u => !u.enabled).length,
    admins: Array.from(userRoles.values()).filter(role => role === 'admin').length,
    hrs: Array.from(userRoles.values()).filter(role => role === 'hr').length,
  };

  if (loading) {
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
        filters={{ search: searchQuery, role: 'all', status: 'all' }}
        onSearchChange={setSearchQuery}
        onRoleChange={() => {}} // TODO: implement
        onStatusChange={() => {}} // TODO: implement
      />

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {users.length} user{users.length !== 1 ? 's' : ''}
      </div>

      <UsersTable
        users={mappedUsers}
        onRoleChange={handleRoleChange}
        onStatusToggle={handleStatusToggle}
        onDelete={handleDelete}
        loadingUsers={loadingUsers}
      />
    </>
  );
}
