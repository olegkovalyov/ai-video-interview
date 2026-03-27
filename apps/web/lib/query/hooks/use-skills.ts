import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { skillKeys, candidateSkillKeys } from '../query-keys';
import { skills as t } from '@/lib/i18n';
import {
  listSkills,
  getSkill,
  createSkill,
  updateSkill,
  toggleSkillStatus,
  deleteSkill,
  listCategories,
  type SkillFilters,
  type CreateSkillDto,
  type UpdateSkillDto,
} from '@/lib/api/skills';
import {
  getMyCandidateSkills,
  addMyCandidateSkill,
  updateMyCandidateSkill,
  removeMyCandidateSkill,
  updateMyExperienceLevel,
  type AddCandidateSkillDto,
  type UpdateCandidateSkillDto,
  type ExperienceLevel,
} from '@/lib/api/candidate-skills';

// ── Admin: Skills ─────────────────────────────

export function useSkills(filters?: SkillFilters) {
  return useQuery({
    queryKey: skillKeys.list(filters),
    queryFn: () => listSkills(filters),
  });
}

export function useSkill(id: string) {
  return useQuery({
    queryKey: skillKeys.detail(id),
    queryFn: () => getSkill(id),
    enabled: !!id,
  });
}

export function useSkillCategories() {
  return useQuery({
    queryKey: skillKeys.categories(),
    queryFn: listCategories,
    staleTime: 10 * 60_000,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: CreateSkillDto) => createSkill(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      toast.success(t.toast.created);
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdateSkillDto }) => updateSkill(id, dto),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      queryClient.invalidateQueries({ queryKey: skillKeys.detail(id) });
      toast.success(t.toast.updated);
    },
  });
}

export function useToggleSkillStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: toggleSkillStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: skillKeys.lists() });
      toast.success(t.toast.deleted);
    },
  });
}

// ── Candidate: My Skills ──────────────────────

export function useMyCandidateSkills() {
  return useQuery({
    queryKey: candidateSkillKeys.my(),
    queryFn: getMyCandidateSkills,
    staleTime: 60_000,
  });
}

export function useAddCandidateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dto: AddCandidateSkillDto) => addMyCandidateSkill(dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateSkillKeys.my() });
      toast.success(t.toast.added);
    },
  });
}

export function useUpdateCandidateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ skillId, dto }: { skillId: string; dto: UpdateCandidateSkillDto }) =>
      updateMyCandidateSkill(skillId, dto),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateSkillKeys.my() });
      toast.success(t.toast.updated);
    },
  });
}

export function useRemoveCandidateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMyCandidateSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateSkillKeys.my() });
      toast.success(t.toast.removed);
    },
  });
}

export function useUpdateExperienceLevel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (level: ExperienceLevel) => updateMyExperienceLevel(level),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: candidateSkillKeys.my() });
      toast.success(t.toast.experienceUpdated);
    },
  });
}
