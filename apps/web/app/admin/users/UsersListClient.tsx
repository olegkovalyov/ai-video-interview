'use client';

import { useState, useEffect } from 'react';
import { Search, User, Mail, Calendar, Shield, Loader2 } from 'lucide-react';
import { listUsers, type User as UserType } from '@/lib/api/users';

export function UsersListClient() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const result = await listUsers({ page, limit, search: search || undefined });
        setUsers(result.users);
        setTotal(result.total);
      } catch (err) {
        console.error('Failed to fetch users:', err);
        setError(err instanceof Error ? err.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [page, search]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1); // Reset to first page on search
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (user: UserType) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email[0]?.toUpperCase() || '?';
  };

  const getFullName = (user: UserType) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email.split('@')[0] || 'Unknown';
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error && users.length === 0) {
    return (
      <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Error Loading Users
        </h3>
        <p className="text-white/80">{error}</p>
      </div>
    );
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={search}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-white/80">
        <p>
          Found {total} user{total !== 1 ? 's' : ''}
          {search && ` matching "${search}"`}
        </p>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {users.map((user) => (
          <div
            key={user.id}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all"
          >
            {/* Avatar & Name */}
            <div className="flex items-center space-x-4 mb-4">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={getFullName(user)}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white/30"
                />
              ) : (
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {getInitials(user)}
                </div>
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white truncate">
                  {getFullName(user)}
                </h3>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    user.status === 'active'
                      ? 'bg-green-400/20 text-green-200 border border-green-400/30'
                      : user.status === 'suspended'
                      ? 'bg-red-400/20 text-red-200 border border-red-400/30'
                      : 'bg-gray-400/20 text-gray-200 border border-gray-400/30'
                  }`}
                >
                  {user.status}
                </span>
              </div>
            </div>

            {/* User Info */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-sm text-white/80">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center space-x-2 text-sm text-white/80">
                  <User className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2 text-sm text-white/80">
                <Calendar className="w-4 h-4" />
                <span>Joined {formatDate(user.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-4 pt-4 border-t border-white/20">
              <button
                className="text-sm text-blue-300 hover:text-blue-200 transition-colors"
                onClick={() => {
                  // TODO: Navigate to user details
                  console.log('View user:', user.id);
                }}
              >
                View Details →
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Previous
          </button>
          <span className="px-4 py-2 text-white">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || loading}
            className="px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Next
          </button>
        </div>
      )}

      {/* No Results */}
      {users.length === 0 && !loading && (
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-12 text-center">
          <Shield className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            No users found
          </h3>
          <p className="text-white/70">
            {search
              ? `No users matching "${search}"`
              : 'No users in the system yet'}
          </p>
        </div>
      )}
    </>
  );
}
