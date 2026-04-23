import { useQuery } from "@tanstack/react-query";
import { analysisKeys } from "../query-keys";
import {
  getAnalysis,
  getAnalysisStatus,
  getCandidateAnalysis,
} from "@/lib/api/analysis";

/**
 * Fetch full analysis results for an invitation (HR/Admin)
 * Polls every 10s while status is pending/in_progress
 */
export function useAnalysis(invitationId: string) {
  return useQuery({
    queryKey: analysisKeys.detail(invitationId),
    queryFn: () => getAnalysis(invitationId),
    enabled: !!invitationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 10_000; // not found yet — poll
      if (data.status === "pending" || data.status === "in_progress") {
        return 10_000; // still processing — poll
      }
      return false; // completed or failed — stop
    },
  });
}

/**
 * Fetch analysis status only (lightweight)
 */
export function useAnalysisStatus(invitationId: string) {
  return useQuery({
    queryKey: analysisKeys.status(invitationId),
    queryFn: () => getAnalysisStatus(invitationId),
    enabled: !!invitationId,
  });
}

/**
 * Fetch candidate-safe analysis results (own analysis only)
 * Polls every 10s while status is pending/in_progress
 */
export function useCandidateAnalysis(invitationId: string) {
  return useQuery({
    queryKey: [...analysisKeys.detail(invitationId), "candidate"],
    queryFn: () => getCandidateAnalysis(invitationId),
    enabled: !!invitationId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 10_000;
      if (data.status === "pending" || data.status === "in_progress") {
        return 10_000;
      }
      return false;
    },
  });
}
