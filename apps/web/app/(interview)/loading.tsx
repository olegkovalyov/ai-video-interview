import { Loader2 } from 'lucide-react';

export default function InterviewLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
        <p className="text-white/80">Loading interview...</p>
      </div>
    </div>
  );
}
