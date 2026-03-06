import type { CompanyFilters } from '@/lib/api/companies';
import type { SkillFilters } from '@/lib/api/skills';
import type { InvitationFilters } from '@/lib/api/invitations';
import type { CandidateSearchFilters } from '@/lib/api/candidate-search';

export const userKeys = {
  all: ['users'] as const,
  me: () => [...userKeys.all, 'me'] as const,
  meStats: () => [...userKeys.all, 'me', 'stats'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: { search?: string }) => [...userKeys.lists(), params] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  roles: (id: string) => [...userKeys.all, id, 'roles'] as const,
  availableRoles: () => [...userKeys.all, 'available-roles'] as const,
};

export const companyKeys = {
  all: ['companies'] as const,
  lists: () => [...companyKeys.all, 'list'] as const,
  list: (filters?: CompanyFilters) => [...companyKeys.lists(), filters] as const,
  details: () => [...companyKeys.all, 'detail'] as const,
  detail: (id: string) => [...companyKeys.details(), id] as const,
};

export const templateKeys = {
  all: ['templates'] as const,
  lists: () => [...templateKeys.all, 'list'] as const,
  list: (filters?: { status?: string; search?: string }) => [...templateKeys.lists(), filters] as const,
  details: () => [...templateKeys.all, 'detail'] as const,
  detail: (id: string) => [...templateKeys.details(), id] as const,
  stats: () => [...templateKeys.all, 'stats'] as const,
  questions: (id: string) => [...templateKeys.all, id, 'questions'] as const,
};

export const invitationKeys = {
  all: ['invitations'] as const,
  hr: () => [...invitationKeys.all, 'hr'] as const,
  hrList: (filters?: InvitationFilters) => [...invitationKeys.hr(), filters] as const,
  candidate: () => [...invitationKeys.all, 'candidate'] as const,
  candidateList: (filters?: InvitationFilters) => [...invitationKeys.candidate(), filters] as const,
  details: () => [...invitationKeys.all, 'detail'] as const,
  detail: (id: string) => [...invitationKeys.details(), id] as const,
};

export const skillKeys = {
  all: ['skills'] as const,
  lists: () => [...skillKeys.all, 'list'] as const,
  list: (filters?: SkillFilters) => [...skillKeys.lists(), filters] as const,
  details: () => [...skillKeys.all, 'detail'] as const,
  detail: (id: string) => [...skillKeys.details(), id] as const,
  categories: () => [...skillKeys.all, 'categories'] as const,
};

export const candidateSkillKeys = {
  all: ['candidate-skills'] as const,
  my: () => [...candidateSkillKeys.all, 'my'] as const,
};

export const candidateSearchKeys = {
  all: ['candidate-search'] as const,
  search: (filters?: CandidateSearchFilters) => [...candidateSearchKeys.all, filters] as const,
};

export const authKeys = {
  all: ['auth'] as const,
  protected: () => [...authKeys.all, 'protected'] as const,
};
