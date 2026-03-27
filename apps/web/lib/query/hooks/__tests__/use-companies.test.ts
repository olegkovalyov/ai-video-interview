import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/i18n', () => ({
  companies: { toast: { created: 'Company created', updated: 'Company updated', deleted: 'Company deleted' } },
}));

vi.mock('@/lib/api/companies', () => ({
  listCompanies: vi.fn(),
  getCompany: vi.fn(),
  createCompany: vi.fn(),
  updateCompany: vi.fn(),
  deleteCompany: vi.fn(),
}));

import { listCompanies, createCompany, deleteCompany } from '@/lib/api/companies';
import { useCompanies, useCompany, useCreateCompany, useDeleteCompany } from '../use-companies';
import { toast } from 'sonner';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCompanies', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches companies without filters', async () => {
    const mockData = {
      data: [{ id: '1', name: 'Acme Corp', industry: 'Tech', size: '11-50', isActive: true, createdBy: 'u1', createdAt: '2026-01-01', updatedAt: '2026-01-01' }],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
    };
    vi.mocked(listCompanies).mockResolvedValue(mockData);

    const { result } = renderHook(() => useCompanies(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(listCompanies).toHaveBeenCalledWith(undefined);
  });

  it('passes filters to listCompanies', async () => {
    const mockData = { data: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 } };
    vi.mocked(listCompanies).mockResolvedValue(mockData);

    const filters = { search: 'test', page: 2 };
    const { result } = renderHook(() => useCompanies(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCompanies).toHaveBeenCalledWith(filters);
  });

  it('handles fetch error', async () => {
    vi.mocked(listCompanies).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCompanies(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not fetch when id is empty string', async () => {
    const { getCompany } = await import('@/lib/api/companies');

    const { result } = renderHook(() => useCompany(''), { wrapper: createWrapper() });

    // Query should remain in initial state since enabled: !!id is false
    expect(result.current.fetchStatus).toBe('idle');
    expect(getCompany).not.toHaveBeenCalled();
  });
});

describe('useCreateCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates a company and shows success toast', async () => {
    const mockCompany = { id: '1', name: 'New Corp', industry: 'Tech', size: '1-10', isActive: true };
    vi.mocked(createCompany).mockResolvedValue(mockCompany as any);

    const { result } = renderHook(() => useCreateCompany(), { wrapper: createWrapper() });

    result.current.mutate({ name: 'New Corp', industry: 'Tech', size: '1-10' });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createCompany).toHaveBeenCalledWith({ name: 'New Corp', industry: 'Tech', size: '1-10' });
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles creation error', async () => {
    vi.mocked(createCompany).mockRejectedValue(new Error('Validation failed'));

    const { result } = renderHook(() => useCreateCompany(), { wrapper: createWrapper() });

    result.current.mutate({ name: '', industry: '', size: '' });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('useDeleteCompany', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a company and shows success toast', async () => {
    vi.mocked(deleteCompany).mockResolvedValue({ success: true, message: 'Deleted' });

    const { result } = renderHook(() => useDeleteCompany(), { wrapper: createWrapper() });

    result.current.mutate('company-123');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(deleteCompany).toHaveBeenCalledWith('company-123', expect.anything());
    expect(toast.success).toHaveBeenCalled();
  });

  it('handles deletion error', async () => {
    vi.mocked(deleteCompany).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useDeleteCompany(), { wrapper: createWrapper() });

    result.current.mutate('nonexistent-id');

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.success).not.toHaveBeenCalled();
  });
});
