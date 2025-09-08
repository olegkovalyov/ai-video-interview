export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3002';

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  console.log('🔧 API: Making POST request to', `${API_BASE}${path}`);
  console.log('🔧 API: Request headers will include credentials');
  
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  
  console.log('🔧 API: Response status:', res.status);
  console.log('🔧 API: Response headers:', Object.fromEntries(res.headers.entries()));
  
  if (!res.ok) {
    const text = await res.text();
    console.log('❌ API: Error response body:', text);
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}
