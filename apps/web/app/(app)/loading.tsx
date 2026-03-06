import { Loader2 } from 'lucide-react';

export default function AppLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-10 h-10 text-white/60 animate-spin mx-auto mb-3" />
        <p className="text-white/50 text-sm">Loading...</p>
      </div>
    </div>
  );
}
