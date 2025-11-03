export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001';

interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  credentials: 'include';
}

async function makeRequest<T>(path: string, options: RequestOptions): Promise<T> {
  // Первая попытка
  let res = await fetch(`${API_BASE}${path}`, options);
  
  // Если 401 и это не auth endpoints, пытаемся обновить токены
  const isAuthEndpoint = path.includes('/auth/refresh') || 
                        path.includes('/auth/logout') || 
                        path.includes('/auth/login') || 
                        path.includes('/auth/register');
                        
  if (res.status === 401 && !isAuthEndpoint) {
    const refreshSuccess = await attemptTokenRefresh();
    
    if (refreshSuccess) {
      // Повторяем исходный запрос
      res = await fetch(`${API_BASE}${path}`, options);
    }
  }
  
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  
  return res.json();
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
  } catch (error) {
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

export async function apiDelete<T>(path: string): Promise<T> {
  return makeRequest<T>(path, {
    method: 'DELETE',
    credentials: 'include',
  });
}
