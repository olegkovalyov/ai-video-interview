"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/layout/header';
import { User, Shield } from 'lucide-react';

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    {
      name: 'Personal Info',
      href: '/profile',
      icon: User,
      active: pathname === '/profile',
    },
    {
      name: 'Security',
      href: '/profile/security',
      icon: Shield,
      active: pathname === '/profile/security',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <Header />
      
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
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      tab.active
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.name}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
