import { Header } from '@/components/layout/header';
import { ProfileClient } from './ProfileClient';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
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

        {/* Dynamic Profile Content */}
        <ProfileClient />
      </div>
    </div>
  );
}
