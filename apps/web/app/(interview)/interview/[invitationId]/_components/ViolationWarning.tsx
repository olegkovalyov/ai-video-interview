import { AlertCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { INTERVIEW } from '@/lib/constants/app';

interface ViolationWarningProps {
  violations: number;
  interviewEnded: boolean;
  onDismiss: () => void;
}

export function ViolationWarning({ violations, interviewEnded, onDismiss }: ViolationWarningProps) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" role="alertdialog" aria-modal="true">
      <div className={`bg-white/10 backdrop-blur-md rounded-xl p-6 max-w-md mx-4 border ${
        interviewEnded ? 'border-red-500/50' : 'border-amber-500/50'
      }`}>
        {interviewEnded ? (
          <>
            <div className="flex items-center gap-3 text-red-400 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-xl font-bold text-white">Interview Ended</h3>
            </div>
            <p className="text-white/90 mb-2">
              You have exceeded the maximum number of violations.
            </p>
            <p className="text-white/70 text-sm mb-4">
              Your interview has been automatically completed. You will be redirected to your dashboard in a few seconds...
            </p>
            <div className="w-full py-3 bg-red-500/50 text-white font-medium rounded-lg text-center">
              <Loader2 className="w-5 h-5 animate-spin inline mr-2" />
              Redirecting...
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-amber-400 mb-4">
              <AlertTriangle className="w-8 h-8" />
              <h3 className="text-xl font-bold text-white">Focus Lost</h3>
            </div>
            <p className="text-white/90 mb-2">
              You switched away from the interview window.
            </p>
            <p className="text-white/70 text-sm mb-4">
              Violation {violations} of {INTERVIEW.MAX_VIOLATIONS}. After {INTERVIEW.MAX_VIOLATIONS} violations, the interview will end automatically.
            </p>
            <button
              onClick={onDismiss}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors cursor-pointer"
            >
              Return to Interview
            </button>
          </>
        )}
      </div>
    </div>
  );
}
