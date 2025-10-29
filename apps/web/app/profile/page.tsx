import { Suspense } from 'react';
import { ProfileClient } from './ProfileClient';
import { Loader2 } from 'lucide-react';

function ProfileFallback() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-12 h-12 text-white animate-spin" />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<ProfileFallback />}>
      <ProfileClient />
    </Suspense>
  );
}
