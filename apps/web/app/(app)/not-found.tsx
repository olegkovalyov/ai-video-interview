import Link from 'next/link';
import { Home } from 'lucide-react';

export default function AppNotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="bg-white/10 backdrop-blur-md rounded-xl p-8 text-center max-w-md border border-white/20">
        <p className="text-6xl font-bold text-white/20 mb-4">404</p>
        <h2 className="text-xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-white/70 mb-6">
          This page does not exist or you may not have access.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
