import { HeaderWithRoles } from '@/components/layout/header-with-roles';
export const dynamic = 'force-dynamic';
import { ProfileNav } from './profile-nav';
import { ProfileWrapper } from './profile-wrapper';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProfileWrapper>
      <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        <HeaderWithRoles />
        
        <main className="container mx-auto px-6 py-12">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">
              Profile Settings
            </h1>
            <p className="text-lg text-white/80">
              Manage your account settings and preferences
            </p>
          </div>

          <div className="flex gap-6">
            {/* Vertical Sidebar */}
            <ProfileNav />

            {/* Content Area */}
            <div className="flex-1">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProfileWrapper>
  );
}
