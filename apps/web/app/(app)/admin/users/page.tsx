import { UsersList } from '@/features/users';
import { Users, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminUsersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <Users className="w-10 h-10 text-white" />
              <h1 className="text-4xl font-bold text-white">
                User Management
              </h1>
            </div>
            <Link href="/admin/users/create">
              <Button className="flex items-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold">
                <UserPlus className="w-4 h-4" />
                Create User
              </Button>
            </Link>
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
