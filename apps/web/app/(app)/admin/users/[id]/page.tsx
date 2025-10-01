import Link from 'next/link';
import { ArrowLeft, Mail, Phone, Globe, Calendar, Clock, Shield, Ban, CheckCircle, Trash2 } from 'lucide-react';

export default function UserDetailPage({ params }: { params: { id: string } }) {
  // Mock data
  const user = {
    id: params.id,
    name: 'John Doe',
    email: 'john.doe@example.com',
    username: 'johndoe',
    phone: '+1 (555) 123-4567',
    status: 'active',
    role: 'user',
    timezone: 'UTC+3',
    language: 'en',
    emailVerified: true,
    joinedAt: '2025-01-15T10:30:00Z',
    lastLogin: '2025-10-01T08:20:36Z',
    bio: 'Software engineer passionate about building scalable systems.',
    metadata: {
      loginCount: 45,
      interviewsCreated: 12,
      interviewsCompleted: 8,
    },
  };

  return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Back Button */}
        <Link
          href="/admin/users"
          className="inline-flex items-center text-white/90 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Link>

        {/* Page Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              User Details
            </h1>
            <p className="text-white/80">
              View and manage user information
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/admin/users/${user.id}/edit`}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold py-2 px-4 rounded-lg transition-colors shadow-lg"
            >
              Edit User
            </Link>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-6">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {user.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h2 className="text-2xl font-semibold text-white">
                  {user.name}
                </h2>
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${
                    user.status === 'active'
                      ? 'bg-green-400/20 text-green-200 border-green-400/30'
                      : 'bg-red-400/20 text-red-200 border-red-400/30'
                  }`}
                >
                  {user.status}
                </span>
                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full border bg-purple-400/20 text-purple-200 border-purple-400/30">
                  {user.role}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center text-white/80">
                  <Mail className="w-4 h-4 mr-2" />
                  {user.email}
                  {user.emailVerified && (
                    <CheckCircle className="w-4 h-4 ml-2 text-green-300" />
                  )}
                </div>
                {user.phone && (
                  <div className="flex items-center text-white/80">
                    <Phone className="w-4 h-4 mr-2" />
                    {user.phone}
                  </div>
                )}
                <div className="flex items-center text-white/80">
                  <Globe className="w-4 h-4 mr-2" />
                  {user.timezone} • {user.language.toUpperCase()}
                </div>
                <div className="flex items-center text-white/80">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined {new Date(user.joinedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>

          {user.bio && (
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/80">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <p className="text-sm text-white/60 mb-1">Total Logins</p>
          <p className="text-3xl font-bold text-white">
            {user.metadata.loginCount}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <p className="text-sm text-white/60 mb-1">Interviews Created</p>
          <p className="text-3xl font-bold text-white">
            {user.metadata.interviewsCreated}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <p className="text-sm text-white/60 mb-1">Completed</p>
          <p className="text-3xl font-bold text-white">
            {user.metadata.interviewsCompleted}
          </p>
        </div>
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <p className="text-sm text-white/60 mb-1">Last Login</p>
          <p className="text-sm font-medium text-white">
            {new Date(user.lastLogin).toLocaleString()}
          </p>
        </div>
        </div>

        {/* Activity Timeline */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Recent Activity
        </h3>
        <div className="space-y-4">
          {[
            { action: 'Logged in', time: '2 hours ago', icon: Clock },
            { action: 'Updated profile', time: '1 day ago', icon: Shield },
            { action: 'Created interview', time: '3 days ago', icon: Calendar },
          ].map((activity, index) => (
            <div key={index} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center border border-blue-400/30">
                <activity.icon className="w-4 h-4 text-blue-300" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-white">{activity.action}</p>
                <p className="text-xs text-white/60">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
        </div>

        {/* Admin Actions */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Admin Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {user.status === 'active' ? (
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/40 text-yellow-200 rounded-lg font-medium transition-colors">
              <Ban className="w-5 h-5" />
              <span>Suspend User</span>
            </button>
          ) : (
            <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-400/20 hover:bg-green-400/30 border border-green-400/40 text-green-200 rounded-lg font-medium transition-colors">
              <CheckCircle className="w-5 h-5" />
              <span>Activate User</span>
            </button>
          )}
          <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-purple-400/20 hover:bg-purple-400/30 border border-purple-400/40 text-purple-200 rounded-lg font-medium transition-colors">
            <Shield className="w-5 h-5" />
            <span>Change Role</span>
          </button>
          <button className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-400/20 hover:bg-red-400/30 border border-red-400/40 text-red-200 rounded-lg font-medium transition-colors">
            <Trash2 className="w-5 h-5" />
            <span>Delete User</span>
          </button>
        </div>
        </div>
      </div>
  );
}
