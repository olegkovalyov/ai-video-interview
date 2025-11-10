export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8001';

interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  credentials: 'include';
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
    let errorMessage = `Request failed with status ${res.status}`;
    let errorCode = 'UNKNOWN_ERROR';
    let errorDetails = null;

    // Try to parse JSON error response
    try {
      const errorData = JSON.parse(text);
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorCode = errorData.code || errorCode;
      errorDetails = errorData;
    } catch {
      // If not JSON, use text as message
      errorMessage = text || errorMessage;
    }

    console.error('🔴 API Error:', {
      status: res.status,
      code: errorCode,
      message: errorMessage,
      url: path,
      details: errorDetails,
    });

    throw new ApiError(errorMessage, res.status, errorCode, errorDetails);
  }
  
  // Проверяем есть ли тело ответа
  const contentType = res.headers.get('content-type');
  const contentLength = res.headers.get('content-length');
  
  // Если нет контента (204 No Content или пустое тело)
  if (res.status === 204 || contentLength === '0') {
    return {} as T;
  }
  
  // Если контент не JSON, возвращаем пустой объект
  if (!contentType || !contentType.includes('application/json')) {
    const text = await res.text();
    if (!text || text.trim() === '') {
      return {} as T;
    }
    // Пытаемся распарсить если есть текст
    try {
      return JSON.parse(text);
    } catch {
      console.warn('⚠️ Response is not JSON:', text);
      return {} as T;
    }
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
