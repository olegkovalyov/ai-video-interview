import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userKeys } from '../query-keys';
import { users as t, profile as tProfile } from '@/lib/i18n';
import {
  getCurrentUser,
  updateCurrentUser,
  listUsers,
  getUserById,
  suspendUser,
  activateUser,
  deleteUser,
  getUserRoles as fetchUserRoles,
  getAvailableRoles,
  assignRole,
  removeRole,
  type User,
} from '@/lib/api/users';

// ── Current User ──────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: userKeys.me(),
    queryFn: getCurrentUser,
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Partial<User>) => updateCurrentUser(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.me() });
      toast.success(tProfile.toast.updated);
    },
  });
}

// ── Admin: User Management ────────────────────

export function useUsers(params?: { search?: string }) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    staleTime: 30_000,
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUserById(id),
    enabled: !!id,
  });
}

export function useSuspendUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: suspendUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(t.toast.suspended);
    },
  });
}

export function useActivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: activateUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(t.toast.activated);
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      toast.success(t.toast.deleted);
    },
  });
}

// ── Admin: Roles ──────────────────────────────

export function useUserRoles(userId: string) {
  return useQuery({
    queryKey: userKeys.roles(userId),
    queryFn: () => fetchUserRoles(userId),
    enabled: !!userId,
  });
}

export function useAvailableRoles() {
  return useQuery({
    queryKey: userKeys.availableRoles(),
    queryFn: getAvailableRoles,
    staleTime: 10 * 60_000,
  });
}

export function useAssignRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      assignRole(userId, roleName),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.roles(userId) });
      toast.success(t.toast.roleAssigned);
    },
  });
}

export function useRemoveRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, roleName }: { userId: string; roleName: string }) =>
      removeRole(userId, roleName),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userKeys.roles(userId) });
      toast.success(t.toast.roleRemoved);
    },
  });
}
