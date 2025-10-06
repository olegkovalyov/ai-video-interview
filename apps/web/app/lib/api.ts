export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001';

interface RequestOptions {
  method: string;
  headers?: Record<string, string>;
  body?: string;
  credentials: 'include';
}

async function makeRequest<T>(path: string, options: RequestOptions): Promise<T> {
  console.log(`🔧 API: Making ${options.method} request to`, `${API_BASE}${path}`);
  
  // Первая попытка
  let res = await fetch(`${API_BASE}${path}`, options);
  
  console.log(`🔧 API: ${options.method} Response status:`, res.status);
  
  // Если 401 и это не refresh/logout endpoint, пытаемся обновить токены
  if (res.status === 401 && !path.includes('/auth/refresh') && !path.includes('/auth/logout')) {
    console.log(`🔄 API: ${options.method} Got 401, attempting token refresh...`);
    
    const refreshSuccess = await attemptTokenRefresh();
    
    if (refreshSuccess) {
      console.log(`🔄 API: Retrying ${options.method} request after successful refresh...`);
      // Повторяем исходный запрос
      res = await fetch(`${API_BASE}${path}`, options);
      
      console.log(`🔧 API: ${options.method} Retry response status:`, res.status);
    } else {
      console.log(`❌ API: ${options.method} Refresh failed`);
      // НЕ редиректим автоматически на /login!
      // Пусть компонент сам решит что делать с 401 ошибкой
      // Только защищенные страницы должны редиректить
    }
  }
  
  if (!res.ok) {
    const text = await res.text();
    console.log(`❌ API: ${options.method} Error response body:`, text);
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
    console.log('🔄 Frontend: Attempting token refresh...');
    console.log('🔄 Frontend: Refresh URL:', `${API_BASE}/auth/refresh`);
    console.log('🔄 Frontend: credentials: include (cookies will be sent)');
    
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    
    console.log('🔄 Frontend: Refresh response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Frontend: Token refresh successful, data:', data);
      return data.success === true;
    } else {
      const errorText = await res.text();
      console.log('❌ Frontend: Token refresh failed');
      console.log('❌ Status:', res.status);
      console.log('❌ Response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ Frontend: Token refresh error:', error);
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
