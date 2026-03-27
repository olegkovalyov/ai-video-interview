import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '../api';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

beforeEach(() => {
  mockFetch.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('apiGet', () => {
  it('makes a GET request and returns JSON', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ id: 1, name: 'Test' }));

    const result = await apiGet<{ id: number; name: string }>('/users/1');

    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/users/1'),
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('throws ApiError on 404', async () => {
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Not found', code: 'NOT_FOUND' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    );

    await expect(apiGet('/users/999')).rejects.toThrow(ApiError);
    await mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'content-type': 'application/json' } }),
    );

    try {
      await apiGet('/users/999');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).statusCode).toBe(404);
    }
  });

  it('handles empty 204 response', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 204 }));

    const result = await apiGet('/empty');
    expect(result).toEqual({});
  });
});

describe('apiPost', () => {
  it('sends JSON body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    await apiPost('/items', { name: 'New Item' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Item' }),
      }),
    );
  });

  it('works without body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));

    await apiPost('/action');

    const call = mockFetch.mock.calls[0]!;
    expect(call[1].body).toBeUndefined();
  });
});

describe('apiPut', () => {
  it('sends PUT with body', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ updated: true }));

    await apiPut('/items/1', { name: 'Updated' });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/1'),
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});

describe('apiDelete', () => {
  it('sends DELETE request', async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ deleted: true }));

    await apiDelete('/items/1');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/items/1'),
      expect.objectContaining({ method: 'DELETE' }),
    );
  });
});

describe('401 auto-refresh', () => {
  it('retries after successful token refresh', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } }),
    );
    // Refresh call succeeds
    mockFetch.mockResolvedValueOnce(jsonResponse({ success: true }));
    // Retry succeeds
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: 'ok' }));

    const result = await apiGet<{ data: string }>('/protected-resource');
    expect(result).toEqual({ data: 'ok' });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it('throws on 401 when refresh fails', async () => {
    // First call returns 401
    mockFetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'content-type': 'application/json' } }),
    );
    // Refresh call fails
    mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ error: 'Refresh failed' }), { status: 401, headers: { 'content-type': 'application/json' } }));

    await expect(apiGet('/protected-resource')).rejects.toThrow(ApiError);
  });
});

describe('ApiError', () => {
  it('has correct properties', () => {
    const err = new ApiError('Not found', 404, 'NOT_FOUND', { field: 'id' });
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
    expect(err.details).toEqual({ field: 'id' });
    expect(err.name).toBe('ApiError');
  });
});
