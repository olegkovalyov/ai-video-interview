import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { invitationKeys, templateKeys } from '../query-keys';
import { interviews as t } from '@/lib/i18n';
import {
  listHRInvitations,
  listCandidateInvitations,
  getInvitation,
  createInvitation,
  startInvitation,
  completeInvitation,
  type InvitationFilters,
  type CreateInvitationDto,
} from '@/lib/api/invitations';

// ── HR Queries ────────────────────────────────

export function useHRInvitations(filters?: InvitationFilters) {
  return useQuery({
    queryKey: invitationKeys.hrList(filters),
    queryFn: () => listHRInvitations(filters),
  });
}

// ── Candidate Queries ─────────────────────────

export function useCandidateInvitations(filters?: InvitationFilters) {
  return useQuery({
    queryKey: invitationKeys.candidateList(filters),
    queryFn: () => listCandidateInvitations(filters),
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
      toast.success(t.toast.invitationCreated);
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
    mutationFn: completeInvitation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.all });
      toast.success(t.toast.completed);
    },
  });
}
