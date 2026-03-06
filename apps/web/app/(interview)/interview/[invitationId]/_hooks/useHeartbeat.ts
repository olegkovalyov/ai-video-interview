import { useEffect, useRef } from 'react';
import { sendHeartbeat } from '@/lib/api/invitations';
import { logger } from '@/lib/logger';
import { INTERVIEW } from '@/lib/constants/app';

export function useHeartbeat(
  invitationId: string,
  status: string | undefined,
  allowPause: boolean | undefined,
) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (status === 'in_progress' && !allowPause) {
      intervalRef.current = setInterval(() => {
        sendHeartbeat(invitationId).catch(err =>
          logger.debug('Heartbeat failed:', err),
        );
      }, INTERVIEW.HEARTBEAT_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, allowPause, invitationId]);
}
