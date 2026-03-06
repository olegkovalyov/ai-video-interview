import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { completeInvitation } from '@/lib/api/invitations';
import { logger } from '@/lib/logger';
import { INTERVIEW } from '@/lib/constants/app';
import type { InterviewAction } from '../_types/interview.types';

/**
 * Soft proctoring: detects tab/window switches via visibilitychange.
 * Active only when allowPause=false (strict mode).
 * After MAX_VIOLATIONS, auto-completes the interview.
 */
export function useProctoring(
  invitationId: string,
  status: string | undefined,
  allowPause: boolean | undefined,
  violations: number,
  interviewEnded: boolean,
  dispatch: React.Dispatch<InterviewAction>,
) {
  const router = useRouter();
  const lastViolationTimeRef = useRef<number>(0);

  // Visibility change detection
  useEffect(() => {
    if (allowPause) return;
    if (status !== 'in_progress' || interviewEnded) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) return;

      const now = Date.now();
      if (now - lastViolationTimeRef.current < INTERVIEW.QUESTION_DEBOUNCE_MS) return;
      lastViolationTimeRef.current = now;

      dispatch({ type: 'RECORD_VIOLATION' });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [status, allowPause, interviewEnded, dispatch]);

  // Auto-complete when max violations reached
  useEffect(() => {
    if (!interviewEnded || violations < INTERVIEW.MAX_VIOLATIONS) return;

    const timer = setTimeout(async () => {
      try {
        await completeInvitation(invitationId);
      } catch (err) {
        logger.error('Failed to complete interview after violations:', err);
      }
      router.push('/candidate/dashboard');
    }, INTERVIEW.COMPLETE_REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [interviewEnded, violations, invitationId, router]);

  // Beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === 'in_progress') {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [status]);
}
