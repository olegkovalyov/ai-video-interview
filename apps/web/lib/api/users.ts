/**
 * User API Client
 * Методы для работы с User Service через API Gateway
 */

import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from '@/lib/api';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  timezone: string;
  language: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  userId: string;
  interviewsCount: number;
  storageUsedMB: number;
  quotaRemaining: {
    interviews: number;
    storageMB: number;
  };
}

export interface UserProfile {
  userId: string;
  bio?: string;
  phone?: string;
  company?: string;
  position?: string;
  location?: string;
}

/**
 * Получить профиль текущего пользователя
 */
export async function getCurrentUser(): Promise<User> {
  return apiGet<User>('/api/users/me');
}

/**
 * Обновить профиль текущего пользователя
 */
export async function updateCurrentUser(updates: Partial<User>): Promise<User> {
  return apiPut<User>('/api/users/me', updates);
}

/**
 * Получить статистику текущего пользователя
 */
export async function getCurrentUserStats(): Promise<UserStats> {
  return apiGet<UserStats>('/api/users/me/stats');
}

/**
 * Загрузить аватар
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  // TODO: Add interceptor support for FormData requests
  const response = await fetch(`${API_BASE}/api/users/me/avatar`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload avatar: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Удалить аватар
 */
export async function deleteAvatar(): Promise<void> {
  return apiDelete<void>('/api/users/me/avatar');
}

/**
 * Зарезервировать квоту для интервью
 */
export async function reserveInterviewQuota(): Promise<{ reservationId: string }> {
  return apiPost<{ reservationId: string }>('/api/users/quota/reserve');
}

// ========================================
// ADMIN ENDPOINTS
// ========================================

export interface KeycloakUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  createdTimestamp?: number;
  lastLoginAt?: string | null;  // From User Service
}

export interface UsersListResponse {
  success: boolean;
  data: KeycloakUser[];
  count: number;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}

export interface CreateUserResponse {
  success: boolean;
  data: {
    userId: string;
    keycloakId: string;
    email: string;
  };
}

/**
 * Create user (Admin) - через Keycloak
 */
export async function createUser(dto: CreateUserDto): Promise<CreateUserResponse> {
  return apiPost<CreateUserResponse>('/api/admin/users', dto);
}

/**
 * Get all users (Admin) - из Keycloak
 */
export async function listUsers(params?: {
  search?: string;
  max?: number;
  first?: number;
}): Promise<KeycloakUser[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append('search', params.search);
  if (params?.max) query.append('max', String(params.max));
  if (params?.first) query.append('first', String(params.first));

  const response = await apiGet<UsersListResponse>(`/api/admin/users${query.toString() ? '?' + query : ''}`);
  return response.data;
}

export interface GetUserResponse {
  success: boolean;
  data: KeycloakUser;
}

/**
 * Get user by ID (Admin) - из Keycloak
 */
export async function getUserById(id: string): Promise<KeycloakUser> {
  const response = await apiGet<GetUserResponse>(`/api/admin/users/${id}`);
  return response.data;
}

/**
 * Suspend user (Admin)
 */
export async function suspendUser(id: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/api/admin/users/${id}/suspend`, {});
}

/**
 * Activate user (Admin)
 */
export async function activateUser(id: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(`/api/admin/users/${id}/activate`, {});
}

/**
 * Delete user (Admin)
 */
export async function deleteUser(id: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(`/api/admin/users/${id}`);
}

// ========================================
// ROLE MANAGEMENT ENDPOINTS
// ========================================

export interface Role {
  id?: string;
  name: string;
  displayName?: string;
}

export interface UserRolesResponse {
  success: boolean;
  data: Role[];
}

export interface AvailableRolesResponse {
  success: boolean;
  data: Role[];
}

/**
 * Get available roles (Admin)
 */
export async function getAvailableRoles(): Promise<Role[]> {
  const response = await apiGet<AvailableRolesResponse>('/api/admin/roles');
  return response.data;
}

/**
 * Get user roles (Admin)
 */
export async function getUserRoles(userId: string): Promise<Role[]> {
  const response = await apiGet<UserRolesResponse>(`/api/admin/users/${userId}/roles`);
  return response.data;
}

/**
 * Assign role to user (Admin)
 */
export async function assignRole(userId: string, roleName: string): Promise<{ success: boolean; message: string }> {
  return apiPost<{ success: boolean; message: string }>(
    `/api/admin/users/${userId}/roles`,
    { roleName }
  );
}

/**
 * Remove role from user (Admin)
 */
export async function removeRole(userId: string, roleName: string): Promise<{ success: boolean; message: string }> {
  return apiDelete<{ success: boolean; message: string }>(
    `/api/admin/users/${userId}/roles/${roleName}`
  );
}
