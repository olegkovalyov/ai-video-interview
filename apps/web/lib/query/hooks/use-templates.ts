import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { templateKeys } from '../query-keys';
import { templates as t } from '@/lib/i18n';
import {
  listTemplates as listTemplatesFromFeature,
  getTemplate as getTemplateFromFeature,
  getQuestions,
  getTemplateStats,
  publishTemplate,
  deleteTemplate,
  duplicateTemplate,
} from '@/features/templates/services/templates-api';
import type { TemplateFilters } from '@/features/templates/types/template.types';
import {
  listTemplates,
  type TemplateFilters as LibTemplateFilters,
} from '@/lib/api/templates';

// ── Queries ───────────────────────────────────

export function useTemplates(filters?: { status?: string; search?: string }) {
  return useQuery({
    queryKey: templateKeys.list(filters),
    queryFn: () =>
      listTemplatesFromFeature(1, 100, {
        status: filters?.status === 'all' ? undefined : (filters?.status as TemplateFilters['status']),
        search: filters?.search,
      }),
  });
}

export function useTemplateStats() {
  return useQuery({
    queryKey: templateKeys.stats(),
    queryFn: getTemplateStats,
    staleTime: 60_000,
  });
}

export function useTemplate(id: string) {
  return useQuery({
    queryKey: templateKeys.detail(id),
    queryFn: () => getTemplateFromFeature(id),
    enabled: !!id,
  });
}

export function useTemplateQuestions(id: string) {
  return useQuery({
    queryKey: templateKeys.questions(id),
    queryFn: () => getQuestions(id),
    enabled: !!id,
  });
}

/** List active templates (for invitation forms) */
export function useActiveTemplates() {
  return useQuery({
    queryKey: templateKeys.list({ status: 'active' }),
    queryFn: () => listTemplates({ status: 'active', limit: 100 }),
    staleTime: 60_000,
    select: (data) => data.data,
  });
}

// ── Mutations ─────────────────────────────────

export function usePublishTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: publishTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      toast.success(t.toast.published);
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.all });
      toast.success(t.toast.deleted);
    },
  });
}

export function useDuplicateTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: duplicateTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: templateKeys.lists() });
      toast.success(t.toast.duplicated);
    },
  });
}
