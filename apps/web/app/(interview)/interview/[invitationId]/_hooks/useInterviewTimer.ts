import { useEffect, useRef } from 'react';
import type { InterviewAction } from '../_types/interview.types';

export function useInterviewTimer(
  showTimer: boolean,
  status: string | undefined,
  dispatch: React.Dispatch<InterviewAction>,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (showTimer && status === 'in_progress') {
      intervalRef.current = setInterval(() => {
        dispatch({ type: 'TICK_TIMER' });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [showTimer, status, dispatch]);
}
