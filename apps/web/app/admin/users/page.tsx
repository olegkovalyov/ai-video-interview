import Link from 'next/link';
import { Search, UserPlus, Filter, MoreVertical } from 'lucide-react';
import { Header } from '@/components/layout/header';

export default function AdminUsersPage() {
  // Mock data
  const users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      status: 'active',
      role: 'user',
      joinedAt: '2025-01-15',
      lastLogin: '2 hours ago',
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      status: 'active',
      role: 'admin',
      joinedAt: '2025-01-10',
      lastLogin: '1 day ago',
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob.johnson@example.com',
      status: 'suspended',
      role: 'user',
      joinedAt: '2024-12-20',
      lastLogin: '5 days ago',
    },
    {
      id: '4',
      name: 'Alice Williams',
      email: 'alice.williams@example.com',
      status: 'active',
      role: 'user',
      joinedAt: '2025-01-12',
      lastLogin: '3 hours ago',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              User Management
            </h1>
            <p className="text-white/80">
              Manage all users in the system
            </p>
          </div>
          <Link
            href="/admin/users/create"
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-3 px-6 rounded-lg flex items-center space-x-2 transition-colors shadow-lg"
          >
            <UserPlus className="w-5 h-5" />
            <span>Add User</span>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <p className="text-sm text-white/60 mb-1">Total Users</p>
            <p className="text-3xl font-bold text-white">1,234</p>
            <p className="text-sm text-green-300 mt-2">+12% this month</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <p className="text-sm text-white/60 mb-1">Active Users</p>
            <p className="text-3xl font-bold text-white">1,189</p>
            <p className="text-sm text-green-300 mt-2">96.4%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <p className="text-sm text-white/60 mb-1">Suspended</p>
            <p className="text-3xl font-bold text-white">45</p>
            <p className="text-sm text-yellow-300 mt-2">3.6%</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
            <p className="text-sm text-white/60 mb-1">New Today</p>
            <p className="text-3xl font-bold text-white">23</p>
            <p className="text-sm text-blue-300 mt-2">Last 24h</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                type="text"
                placeholder="Search users by name, email..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder:text-white/50"
              />
            </div>

            {/* Status Filter */}
            <select className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>

            {/* Role Filter */}
            <select className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white cursor-pointer">
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="user">User</option>
            </select>

            <button className="px-4 py-2 bg-white/20 hover:bg-white/30 border border-white/40 text-white rounded-lg flex items-center space-x-2 transition-colors cursor-pointer">
              <Filter className="w-5 h-5" />
              <span>More Filters</span>
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/10 border-b border-white/20">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.name}
                          </div>
                          <div className="text-sm text-white/70">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          user.status === 'active'
                            ? 'bg-green-400/20 text-green-200 border-green-400/30'
                            : 'bg-red-400/20 text-red-200 border-red-400/30'
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${
                          user.role === 'admin'
                            ? 'bg-purple-400/20 text-purple-200 border-purple-400/30'
                            : 'bg-blue-400/20 text-blue-200 border-blue-400/30'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {user.joinedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                      {user.lastLogin}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="text-yellow-400 hover:text-yellow-300 font-semibold mr-4 cursor-pointer"
                      >
                        View
                      </Link>
                      <button className="text-white/60 hover:text-white cursor-pointer">
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-white/10 px-6 py-4 border-t border-white/20 flex items-center justify-between">
            <div className="text-sm text-white/70">
              Showing 1 to 4 of 1,234 users
            </div>
            <div className="flex space-x-2">
              <button className="px-4 py-2 bg-white/10 border border-white/30 rounded-lg text-sm font-medium text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-lg text-sm font-semibold transition-colors">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
