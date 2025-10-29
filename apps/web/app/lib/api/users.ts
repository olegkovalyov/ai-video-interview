import { apiGet, apiPost, apiPut, apiDelete } from '../api';

/**
 * User Types
 */
export interface User {
  id: string;
  keycloakId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  status: 'active' | 'suspended' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface ListUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface ListUsersResponse {
  data: User[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  bio?: string;
  phone?: string;
}

export interface SuspendUserDto {
  reason?: string;
}

/**
 * Users API Client
 */
export const usersApi = {
  /**
   * List all users (Admin/HR)
   */
  async list(params?: ListUsersParams): Promise<ListUsersResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.search) queryParams.set('search', params.search);
    if (params?.role) queryParams.set('role', params.role);
    if (params?.status) queryParams.set('status', params.status);

    const query = queryParams.toString();
    return apiGet<ListUsersResponse>(`/users${query ? `?${query}` : ''}`);
  },

  /**
   * Get user by ID (Admin/HR)
   */
  async get(id: string): Promise<User> {
    return apiGet<User>(`/users/${id}`);
  },

  /**
   * Update user (Admin)
   */
  async update(id: string, data: UpdateUserDto): Promise<User> {
    return apiPut<User>(`/users/${id}`, data);
  },

  /**
   * Suspend user (Admin)
   */
  async suspend(id: string, reason?: string): Promise<User> {
    return apiPost<User>(`/users/${id}/suspend`, { reason });
  },

  /**
   * Activate user (Admin)
   */
  async activate(id: string): Promise<User> {
    return apiPost<User>(`/users/${id}/activate`, {});
  },

  /**
   * Delete user (Admin)
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    return apiDelete<{ success: boolean; message: string }>(`/users/${id}`);
  },
};
