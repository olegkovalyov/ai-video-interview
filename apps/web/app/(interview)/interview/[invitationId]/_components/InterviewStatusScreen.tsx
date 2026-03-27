import { Loader2, AlertCircle, CheckCircle, Home } from 'lucide-react';
import Link from 'next/link';
import type { InvitationStatus } from '@/lib/api/invitations';

const SCREEN_BG = 'min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center';
const CARD = 'bg-white/10 backdrop-blur-md rounded-xl p-8 text-center max-w-md border border-white/20';
const LINK = 'inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors cursor-pointer';

export function LoadingScreen() {
  return (
    <div className={SCREEN_BG}>
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white/80">Loading interview...</p>
      </div>
    </div>
  );
}

export function ErrorScreen({ error }: { error: string | null }) {
  return (
    <div className={SCREEN_BG}>
      <div className={CARD}>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Error</h2>
        <p className="text-white/70 mb-6">{error || 'Failed to load interview'}</p>
        <Link href="/candidate/dashboard" className={LINK}>
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}

export function StatusScreen({ status }: { status: InvitationStatus }) {
  const config = {
    completed: {
      icon: <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />,
      title: 'Interview Completed',
      message: 'You have successfully completed this interview.',
    },
    expired: {
      icon: <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-4" />,
      title: 'Interview Expired',
      message: 'This interview has expired and can no longer be taken.',
    },
  } as const;

  const screen = config[status as keyof typeof config];
  if (!screen) return null;

  return (
    <div className={SCREEN_BG}>
      <div className={CARD}>
        {screen.icon}
        <h2 className="text-xl font-bold text-white mb-2">{screen.title}</h2>
        <p className="text-white/70 mb-6">{screen.message}</p>
        <Link href="/candidate/dashboard" className={LINK}>
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
