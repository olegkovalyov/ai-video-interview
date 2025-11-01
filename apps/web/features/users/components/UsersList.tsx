'use client';

import { UserStatsCards } from './UserStatsCards';
import { UserFilters } from './UserFilters';
import { UsersTable } from './UsersTable';
import { useUserFilters } from '../hooks/use-user-filters';
import { MOCK_USERS } from '../services/users-mock';

export function UsersList() {
  const {
    filteredUsers,
    filters,
    stats,
    updateSearch,
    updateRoleFilter,
    updateStatusFilter,
    updateUserRole,
    toggleUserStatus,
    deleteUser,
  } = useUserFilters(MOCK_USERS);

  return (
    <>
      <UserStatsCards stats={stats} />

      <UserFilters
        filters={filters}
        onSearchChange={updateSearch}
        onRoleChange={updateRoleFilter}
        onStatusChange={updateStatusFilter}
      />

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''}
      </div>

      <UsersTable
        users={filteredUsers}
        onRoleChange={updateUserRole}
        onStatusToggle={toggleUserStatus}
        onDelete={deleteUser}
      />

      {/* Info */}
      <div className="mt-4 text-sm text-white/60">
        💡 This is a demo version with hardcoded data. Full functionality will be available after API integration.
      </div>
    </>
  );
}
