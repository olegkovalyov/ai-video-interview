import Link from 'next/link';
import { User, Settings, Upload, Shield } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            My Profile
          </h1>
          <p className="text-white/80">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Profile Overview Card */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 mb-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              JD
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-white">
                John Doe
              </h2>
              <p className="text-white/80">john.doe@example.com</p>
              <span className="inline-block mt-1 px-3 py-1 bg-green-400/20 text-green-200 text-sm rounded-full border border-green-400/30">
                Active
              </span>
            </div>
          </div>

          <div className="border-t border-white/20 pt-4">
            <h3 className="text-lg font-semibold text-white mb-3">
              Quick Info
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/60">Joined</p>
                <p className="text-white font-medium">
                  January 15, 2025
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Last Login</p>
                <p className="text-white font-medium">
                  2 hours ago
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Timezone</p>
                <p className="text-white font-medium">UTC+3</p>
              </div>
              <div>
                <p className="text-sm text-white/60">Language</p>
                <p className="text-white font-medium">English</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Edit Profile */}
          <Link href="/profile/edit" className="h-full">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
              <div className="w-12 h-12 bg-blue-400/20 rounded-lg flex items-center justify-center mb-4 border border-blue-400/30">
                <Settings className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Edit Profile
              </h3>
              <p className="text-sm text-white/70">
                Update your personal information and bio
              </p>
            </div>
          </Link>

          {/* Upload Avatar */}
          <Link href="/profile/avatar" className="h-full">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
              <div className="w-12 h-12 bg-purple-400/20 rounded-lg flex items-center justify-center mb-4 border border-purple-400/30">
                <Upload className="w-6 h-6 text-purple-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Change Avatar
              </h3>
              <p className="text-sm text-white/70">
                Upload a new profile picture
              </p>
            </div>
          </Link>

          {/* View Users (Admin) */}
          <Link href="/admin/users" className="h-full">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
              <div className="w-12 h-12 bg-green-400/20 rounded-lg flex items-center justify-center mb-4 border border-green-400/30">
                <User className="w-6 h-6 text-green-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Manage Users
              </h3>
              <p className="text-sm text-white/70">
                View and manage all users (Admin only)
              </p>
            </div>
          </Link>

          {/* Security */}
          <Link href="/profile/security" className="h-full">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all cursor-pointer h-full flex flex-col">
              <div className="w-12 h-12 bg-red-400/20 rounded-lg flex items-center justify-center mb-4 border border-red-400/30">
                <Shield className="w-6 h-6 text-red-300" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                Security
              </h3>
              <p className="text-sm text-white/70">
                Manage password and security settings
              </p>
            </div>
          </Link>
        </div>

        {/* Bio Section */}
        <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-3">
            About Me
          </h3>
          <p className="text-white/80">
            Software engineer passionate about building scalable systems and mentoring junior developers.
            Love working with microservices architecture and event-driven design.
          </p>
        </div>
      </div>
    </div>
  );
}
