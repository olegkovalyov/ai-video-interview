import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { invitationKeys, templateKeys } from "../query-keys";
import { interviews as t } from "@/lib/i18n";
import {
  listHRInvitations,
  listCandidateInvitations,
  getInvitation,
  createInvitation,
  startInvitation,
  completeInvitation,
  approveCandidate,
  rejectCandidate,
  type InvitationFilters,
  type CreateInvitationDto,
} from "@/lib/api/invitations";

// ── HR Queries ────────────────────────────────

export function useHRInvitations(filters?: InvitationFilters) {
  return useQuery({
    queryKey: invitationKeys.hrList(filters),
    queryFn: () => listHRInvitations(filters),
    refetchInterval: (query) => {
      // Poll every 30s while there are pending/in_progress or analysis in progress
      const items = query.state.data?.items;
      if (!items || items.length === 0) return false;
      const hasActive = items.some(
        (inv) =>
          inv.status === "pending" ||
          inv.status === "in_progress" ||
          inv.analysisStatus === "pending" ||
          inv.analysisStatus === "in_progress",
      );
      return hasActive ? 30_000 : false;
    },
    refetchIntervalInBackground: false,
  });
}

// ── Candidate Queries ─────────────────────────

export function useCandidateInvitations(filters?: InvitationFilters) {
  return useQuery({
    queryKey: invitationKeys.candidateList(filters),
    queryFn: () => listCandidateInvitations(filters),
    refetchInterval: (query) => {
      // Candidate: poll while analysis is in progress (to show score when ready)
      const items = query.state.data?.items;
      if (!items || items.length === 0) return false;
      const hasActive = items.some(
        (inv) =>
          inv.analysisStatus === "pending" ||
          inv.analysisStatus === "in_progress",
      );
      return hasActive ? 30_000 : false;
    },
    refetchIntervalInBackground: false,
  });
}

// ── Shared Queries ────────────────────────────

export function useInvitation(id: string, includeTemplate = false) {
  return useQuery({
    queryKey: invitationKeys.detail(id),
    queryFn: () => getInvitation(id, includeTemplate),
    enabled: !!id,
  });
}

// ── Mutations ─────────────────────────────────

export function useCreateInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateInvitationDto) => createInvitation(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.hr() });
    },
  });
}

export function useStartInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: startInvitation,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: invitationKeys.candidate() });
    },
  });
}

export function useCompleteInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => completeInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      toast.success(t.toast.completed);
    },
  });
}

export function useApproveCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note?: string }) =>
      approveCandidate(id, note),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      queryClient.invalidateQueries({ queryKey: invitationKeys.detail(id) });
      toast.success("Candidate approved");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to approve candidate");
    },
  });
}

export function useRejectCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      rejectCandidate(id, note),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      queryClient.invalidateQueries({ queryKey: invitationKeys.detail(id) });
      toast.success("Candidate rejected");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to reject candidate");
    },
  });
}
