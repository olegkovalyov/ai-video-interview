'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FileText, Users, Send, CheckCircle } from 'lucide-react';

const sidebarItems = [
  {
    name: 'Templates',
    href: '/hr/interviews/templates',
    icon: FileText,
  },
  {
    name: 'Candidates',
    href: '/hr/interviews/candidates',
    icon: Users,
  },
  {
    name: 'Invitations',
    href: '/hr/interviews/invitations',
    icon: Send,
  },
  {
    name: 'Review',
    href: '/hr/interviews/review',
    icon: CheckCircle,
  },
];

export default function InterviewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      <main className="container mx-auto px-6 py-12">
        <div className="flex gap-6">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white/10 backdrop-blur-md border border-white/20 rounded-lg p-2 sticky top-24 [&_a]:cursor-pointer">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all !cursor-pointer ${
                      isActive
                        ? 'bg-white/20 text-white shadow-lg'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    <Icon className="w-5 h-5 pointer-events-none" />
                    <span className="font-medium pointer-events-none">{item.name}</span>
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
