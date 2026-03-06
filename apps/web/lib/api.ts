import { logger } from './logger';
import { API_TIMEOUT_MS } from './constants/app';

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001';

interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  credentials: 'include';
  signal?: AbortSignal;
}

/**
 * Custom API Error with structured error details
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const AUTH_ENDPOINTS = ['/auth/refresh', '/auth/logout', '/auth/login', '/auth/register'];

async function makeRequest<T>(path: string, options: RequestOptions): Promise<T> {
  if (path !== '/protected') {
    logger.debug('API Request:', options.method, path);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  const requestOptions = { ...options, signal: controller.signal };

  try {
    let res = await fetch(`${API_BASE}${path}`, requestOptions);

    // Auto-refresh on 401 (skip auth endpoints to avoid loops)
    const isAuthEndpoint = AUTH_ENDPOINTS.some(ep => path.includes(ep));
    if (res.status === 401 && !isAuthEndpoint) {
      const refreshSuccess = await attemptTokenRefresh();
      if (refreshSuccess) {
        res = await fetch(`${API_BASE}${path}`, options);
      }
    }

    if (!res.ok) {
      let text = '';
      try { text = await res.text(); } catch { /* ignore */ }

      let errorMessage = `Request failed with status ${res.status}`;
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetails = null;

      if (text) {
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
          errorCode = errorData.code || errorCode;
          errorDetails = errorData;
        } catch {
          errorMessage = text || errorMessage;
        }
      }

      // Don't log 401 for /protected — normal auth check
      if (!(path === '/protected' && res.status === 401)) {
        logger.error('API Error:', res.status, options.method, path, errorCode);
      }

      throw new ApiError(errorMessage, res.status, errorCode, errorDetails);
    }

    // Handle empty responses
    const contentType = res.headers.get('content-type');
    const contentLength = res.headers.get('content-length');

    if (res.status === 204 || contentLength === '0') {
      return {} as T;
    }

    if (!contentType || !contentType.includes('application/json')) {
      const text = await res.text();
      if (!text || text.trim() === '') return {} as T;
      try {
        return JSON.parse(text);
      } catch {
        logger.warn('Response is not JSON:', path);
        return {} as T;
      }
    }

    return res.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ApiError(
        `Request timed out after ${API_TIMEOUT_MS / 1000}s`,
        0,
        'TIMEOUT_ERROR',
      );
    }

    logger.error('Network Error:', options.method, path, error instanceof Error ? error.message : error);

    throw new ApiError(
      'Network error. Please check your connection and ensure the API server is running.',
      0,
      'NETWORK_ERROR',
      error,
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function attemptTokenRefresh(): Promise<boolean> {
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = performRefresh();

  const result = await refreshPromise;
  isRefreshing = false;
  refreshPromise = null;

  return result;
}

async function performRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });

    if (res.ok) {
      const data = await res.json();
      return data.success === true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return makeRequest<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiGet<T>(path: string): Promise<T> {
  return makeRequest<T>(path, {
    method: 'GET',
    credentials: 'include',
  });
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return makeRequest<T>(path, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return makeRequest<T>(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

export async function apiDelete<T>(path: string): Promise<T> {
  return makeRequest<T>(path, {
    method: 'DELETE',
    credentials: 'include',
  });
}
