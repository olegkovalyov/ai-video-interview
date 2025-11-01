import { useState, useEffect, useMemo } from 'react';
import { User, UserRole, UserStatus, UserFilters, UserStats } from '../types/user.types';

export function useUserFilters(initialUsers: User[]) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: 'all',
    status: 'all',
  });

  // Apply filters
  useEffect(() => {
    let filtered = users;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.firstName.toLowerCase().includes(searchLower) ||
          user.lastName.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      );
    }

    // Role filter
    if (filters.role !== 'all') {
      filtered = filtered.filter((user) => user.role === filters.role);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((user) => user.status === filters.status);
    }

    setFilteredUsers(filtered);
  }, [filters, users]);

  // Calculate stats
  const stats: UserStats = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === 'active').length,
      suspended: users.filter((u) => u.status === 'suspended').length,
      admins: users.filter((u) => u.role === 'admin').length,
      hrs: users.filter((u) => u.role === 'hr').length,
    }),
    [users]
  );

  const updateSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const updateRoleFilter = (role: UserRole | 'all') => {
    setFilters((prev) => ({ ...prev, role }));
  };

  const updateStatusFilter = (status: UserStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const updateUserRole = (userId: string, newRole: UserRole) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
  };

  const toggleUserStatus = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === userId
          ? { ...u, status: u.status === 'active' ? ('suspended' as UserStatus) : ('active' as UserStatus) }
          : u
      )
    );
  };

  const deleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'deleted' as UserStatus } : u)));
    }
  };

  return {
    users,
    filteredUsers,
    filters,
    stats,
    updateSearch,
    updateRoleFilter,
    updateStatusFilter,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
  };
}
