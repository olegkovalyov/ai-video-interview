/**
 * User API Client
 * Методы для работы с User Service через API Gateway
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    credentials: 'include', // Отправляем cookies
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch current user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Обновить профиль текущего пользователя
 */
export async function updateCurrentUser(updates: Partial<User>): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/me`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error(`Failed to update user: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Получить статистику текущего пользователя
 */
export async function getCurrentUserStats(): Promise<UserStats> {
  const response = await fetch(`${API_BASE_URL}/api/users/me/stats`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Загрузить аватар
 */
export async function uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`, {
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
  const response = await fetch(`${API_BASE_URL}/api/users/me/avatar`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(`Failed to delete avatar: ${response.statusText}`);
  }
}

/**
 * Зарезервировать квоту для интервью
 */
export async function reserveInterviewQuota(): Promise<{ reservationId: string }> {
  const response = await fetch(`${API_BASE_URL}/api/users/quota/reserve`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to reserve quota: ${response.statusText}`);
  }

  return response.json();
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

  const response = await fetch(
    `${API_BASE_URL}/api/users?${query}`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch users list: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Получить пользователя по ID (admin)
 */
export async function getUserById(id: string): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch user: ${response.statusText}`);
  }

  return response.json();
}
