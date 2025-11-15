"use client";

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { User, Shield, Star } from 'lucide-react';

export function ProfileNav() {
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
    {
      name: 'Skills',
      href: '/profile/skills',
      icon: Star,
      active: pathname === '/profile/skills',
    },
  ];

  return (
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
  );
}
