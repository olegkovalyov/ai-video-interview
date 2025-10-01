import Link from 'next/link';
import { User, Users, Home, LogOut } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
      {/* Top Navigation */}
      <nav className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-lg flex items-center justify-center text-gray-900 font-bold">
                🎥
              </div>
              <span className="font-bold text-xl text-white">
                AI Interview
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-6">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors font-medium"
              >
                <Home className="w-5 h-5" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors font-medium"
              >
                <User className="w-5 h-5" />
                <span>Profile</span>
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center space-x-2 text-white/90 hover:text-white transition-colors font-medium"
              >
                <Users className="w-5 h-5" />
                <span>Admin</span>
              </Link>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3 border-l border-white/30 pl-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                  JD
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    John Doe
                  </p>
                  <p className="text-xs text-white/70">Admin</p>
                </div>
              </div>
              <button className="text-white/80 hover:text-white transition-colors cursor-pointer">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around">
            <Link
              href="/dashboard"
              className="flex flex-col items-center text-white/80 hover:text-white transition-colors"
            >
              <Home className="w-6 h-6" />
              <span className="text-xs mt-1">Dashboard</span>
            </Link>
            <Link
              href="/profile"
              className="flex flex-col items-center text-white/80 hover:text-white transition-colors"
            >
              <User className="w-6 h-6" />
              <span className="text-xs mt-1">Profile</span>
            </Link>
            <Link
              href="/admin/users"
              className="flex flex-col items-center text-white/80 hover:text-white transition-colors"
            >
              <Users className="w-6 h-6" />
              <span className="text-xs mt-1">Admin</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-white/10 backdrop-blur-md border-t border-white/20 mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/80">
              © 2025 AI Video Interview. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link
                href="/about"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                About
              </Link>
              <Link
                href="/privacy"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-white/80 hover:text-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
