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
  // Don't log /protected requests - they're auth checks
  if (path !== '/protected') {
    console.log('📤 API Request:', {
      url: `${API_BASE}${path}`,
      method: options.method,
    });
  }
  
  try {
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
      let text = '';
      try {
        text = await res.text();
      } catch (textError) {
        console.error('Failed to read response text:', textError);
      }
      
      let errorMessage = `Request failed with status ${res.status}`;
      let errorCode = 'UNKNOWN_ERROR';
      let errorDetails = null;

      // Try to parse JSON error response
      if (text) {
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.error || errorData.message || errorMessage;
          errorCode = errorData.code || errorCode;
          errorDetails = errorData;
        } catch {
          // If not JSON, use text as message
          errorMessage = text || errorMessage;
        }
      }

      // Don't log 401 errors for /protected - это нормальная проверка auth
      const isAuthCheck = path === '/protected' && res.status === 401;
      
      if (!isAuthCheck) {
        console.error('🔴 API Error:', {
          fullUrl: `${API_BASE}${path}`,
          path,
          method: options.method,
          status: res.status,
          statusText: res.statusText,
          code: errorCode,
          message: errorMessage,
          responseText: text.substring(0, 500), // First 500 chars
          details: errorDetails,
        });
      }

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
  } catch (error) {
    // Network error, CORS, timeout, etc.
    if (error instanceof ApiError) {
      // Пробрасываем API ошибки как есть
      throw error;
    }
    
    // Network/CORS/other fetch errors
    console.error('🔴 Network Error:', {
      url: `${API_BASE}${path}`,
      method: options.method,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    });
    
    throw new ApiError(
      'Network error. Please check your connection and ensure the API server is running.',
      0,
      'NETWORK_ERROR',
      error
    );
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
