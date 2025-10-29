/**
 * User API Client
 * Методы для работы с User Service через API Gateway
 */

import { apiGet, apiPost, apiPut, apiDelete, API_BASE } from '@/app/lib/api';

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

export interface UsersListResponse {
  users: User[];
  total: number;
  page: number;
}

/**
 * Получить список всех пользователей (admin)
 */
export async function listUsers(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<UsersListResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.search) query.append('search', params.search);

  return apiGet<UsersListResponse>(`/api/users?${query}`);
}

/**
 * Получить пользователя по ID (admin)
 */
export async function getUserById(id: string): Promise<User> {
  return apiGet<User>(`/api/users/${id}`);
}
