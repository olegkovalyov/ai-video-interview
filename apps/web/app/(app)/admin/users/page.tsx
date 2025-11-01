import { UsersList } from '@/features/users';
import { Users } from 'lucide-react';

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-10 h-10 text-white" />
            <h1 className="text-4xl font-bold text-white">
              User Management
            </h1>
          </div>
          <p className="text-white/80">
            Manage all users in the system
          </p>
        </div>

        {/* Dynamic Users List */}
        <UsersList />
      </div>
    </div>
  );
}
