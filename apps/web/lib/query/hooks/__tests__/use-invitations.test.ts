import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/lib/i18n', () => ({
  interviews: { toast: { invitationCreated: 'Invitation sent', completed: 'Interview completed', started: 'Interview started!' } },
}));

vi.mock('@/lib/api/invitations', () => ({
  listHRInvitations: vi.fn(),
  listCandidateInvitations: vi.fn(),
  getInvitation: vi.fn(),
  createInvitation: vi.fn(),
  startInvitation: vi.fn(),
  completeInvitation: vi.fn(),
}));

import {
  listHRInvitations,
  listCandidateInvitations,
  createInvitation,
  completeInvitation,
} from '@/lib/api/invitations';
import {
  useHRInvitations,
  useCandidateInvitations,
  useCreateInvitation,
  useCompleteInvitation,
} from '../use-invitations';
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

describe('useHRInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches HR invitations without filters', async () => {
    const mockData = {
      items: [{ id: 'inv-1', templateTitle: 'Interview A', status: 'pending' }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    vi.mocked(listHRInvitations).mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useHRInvitations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(listHRInvitations).toHaveBeenCalledWith(undefined);
  });

  it('passes filters to listHRInvitations', async () => {
    const mockData = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    vi.mocked(listHRInvitations).mockResolvedValue(mockData);

    const filters = { status: 'completed' as const, page: 2 };
    const { result } = renderHook(() => useHRInvitations(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listHRInvitations).toHaveBeenCalledWith(filters);
  });

  it('handles fetch error', async () => {
    vi.mocked(listHRInvitations).mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useHRInvitations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});

describe('useCandidateInvitations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches candidate invitations without filters', async () => {
    const mockData = {
      items: [{ id: 'inv-2', templateTitle: 'Interview B', status: 'pending' }],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    };
    vi.mocked(listCandidateInvitations).mockResolvedValue(mockData as any);

    const { result } = renderHook(() => useCandidateInvitations(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(listCandidateInvitations).toHaveBeenCalledWith(undefined);
  });

  it('passes status filter to listCandidateInvitations', async () => {
    const mockData = { items: [], total: 0, page: 1, limit: 10, totalPages: 0 };
    vi.mocked(listCandidateInvitations).mockResolvedValue(mockData);

    const filters = { status: 'in_progress' as const };
    const { result } = renderHook(() => useCandidateInvitations(filters), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(listCandidateInvitations).toHaveBeenCalledWith(filters);
  });
});

describe('useCreateInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates an invitation and shows success toast', async () => {
    const mockInvitation = { id: 'inv-new', status: 'pending' };
    vi.mocked(createInvitation).mockResolvedValue(mockInvitation as any);

    const dto = {
      templateId: 'tpl-1',
      candidateId: 'user-1',
      companyName: 'Acme Corp',
      expiresAt: '2026-04-01T00:00:00Z',
    };

    const { result } = renderHook(() => useCreateInvitation(), { wrapper: createWrapper() });

    result.current.mutate(dto);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(createInvitation).toHaveBeenCalledWith(dto);
    expect(toast.success).toHaveBeenCalledWith('Invitation sent');
  });

  it('handles creation error', async () => {
    vi.mocked(createInvitation).mockRejectedValue(new Error('Template not found'));

    const { result } = renderHook(() => useCreateInvitation(), { wrapper: createWrapper() });

    result.current.mutate({
      templateId: 'bad-id',
      candidateId: 'user-1',
      companyName: 'Corp',
      expiresAt: '2026-04-01T00:00:00Z',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('useCompleteInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes an invitation and shows success toast', async () => {
    const mockResult = { id: 'inv-1', status: 'completed' };
    vi.mocked(completeInvitation).mockResolvedValue(mockResult as any);

    const { result } = renderHook(() => useCompleteInvitation(), { wrapper: createWrapper() });

    result.current.mutate('inv-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(completeInvitation).toHaveBeenCalledWith('inv-1', expect.anything());
    expect(toast.success).toHaveBeenCalledWith('Interview completed');
  });
});
