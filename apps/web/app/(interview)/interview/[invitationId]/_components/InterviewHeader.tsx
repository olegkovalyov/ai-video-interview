import { Clock, AlertTriangle } from 'lucide-react';
import type { Question, InvitationWithDetails } from '@/lib/api/invitations';
import { INTERVIEW } from '@/lib/constants/app';

interface InterviewHeaderProps {
  templateTitle: string;
  companyName: string;
  currentQuestionIndex: number;
  totalQuestions: number;
  progressPercent: number;
  elapsedTime: number;
  showTimer: boolean;
  allowPause: boolean;
  violations: number;
  completing: boolean;
  questions: Question[];
  isQuestionAnswered: (questionId: string) => boolean;
  onQuestionSelect: (index: number) => void;
  onSaveAndExit: () => void;
  onFinishNow: () => void;
}

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function InterviewHeader({
  templateTitle,
  companyName,
  currentQuestionIndex,
  totalQuestions,
  progressPercent,
  elapsedTime,
  showTimer,
  allowPause,
  violations,
  completing,
  questions,
  isQuestionAnswered,
  onQuestionSelect,
  onSaveAndExit,
  onFinishNow,
}: InterviewHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title */}
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-white truncate">{templateTitle}</h1>
            <p className="text-white/60 text-sm truncate">{companyName}</p>
          </div>

          {/* Center: Progress */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="text-center">
              <p className="text-white font-medium">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <span className="text-white/60 text-xs">{progressPercent}%</span>
              </div>
            </div>
          </div>

          {/* Right: Timer & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {showTimer && (
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg">
                <Clock className="w-4 h-4 text-white" />
                <span className="text-white font-mono text-sm">{formatTime(elapsedTime)}</span>
              </div>
            )}

            {!allowPause && violations > 0 && (
              <div className="hidden sm:flex items-center gap-1 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <span>{violations}/{INTERVIEW.MAX_VIOLATIONS}</span>
              </div>
            )}

            {allowPause && (
              <button
                onClick={onSaveAndExit}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors cursor-pointer"
              >
                Save & Exit
              </button>
            )}
            <button
              onClick={onFinishNow}
              disabled={completing}
              className="px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {completing ? 'Finishing...' : 'Finish Now'}
            </button>
          </div>
        </div>
      </div>

      {/* Question Navigator */}
      <div className="px-4 sm:px-6 py-2 bg-white/5 border-t border-white/10 overflow-x-auto">
        <div className="flex gap-1.5 min-w-max justify-center">
          {questions.map((q, idx) => {
            const answered = isQuestionAnswered(q.id);
            const isCurrent = idx === currentQuestionIndex;
            return (
              <button
                key={q.id}
                onClick={() => onQuestionSelect(idx)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-yellow-400 text-white ring-2 ring-yellow-300 ring-offset-2 ring-offset-purple-600'
                    : answered
                    ? 'bg-green-500/30 text-green-300 border border-green-500/50'
                    : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
