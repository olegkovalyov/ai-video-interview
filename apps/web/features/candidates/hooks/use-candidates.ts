import { useState, useEffect, useMemo } from 'react';
import { Candidate, CandidateFilters, CandidateStats, CandidateStatus } from '../types/candidate.types';

export function useCandidates(initialCandidates: Candidate[] = []) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(initialCandidates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<CandidateFilters>({
    search: '',
    status: 'all',
    interview: 'all',
  });

  // Apply filters
  useEffect(() => {
    let filtered = candidates;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (candidate) =>
          candidate.name.toLowerCase().includes(searchLower) ||
          candidate.email.toLowerCase().includes(searchLower) ||
          candidate.position.toLowerCase().includes(searchLower) ||
          candidate.location?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((candidate) => candidate.status === filters.status);
    }

    // Interview filter
    if (filters.interview !== 'all') {
      filtered = filtered.filter((candidate) => candidate.interview === filters.interview);
    }

    setFilteredCandidates(filtered);
  }, [filters, candidates]);

  // Calculate stats
  const stats: CandidateStats = useMemo(() => {
    const total = candidates.length;
    const completed = candidates.filter((c) => c.status === 'completed').length;
    const inProgress = candidates.filter((c) => c.status === 'in_progress').length;
    const pending = candidates.filter((c) => c.status === 'pending').length;

    return { total, completed, inProgress, pending };
  }, [candidates]);

  // Get unique interviews for filter
  const interviews = useMemo(() => {
    const uniqueInterviews = Array.from(new Set(candidates.map((c) => c.interview)));
    return uniqueInterviews.sort();
  }, [candidates]);

  const updateSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const updateStatusFilter = (status: CandidateStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const updateInterviewFilter = (interview: string | 'all') => {
    setFilters((prev) => ({ ...prev, interview }));
  };

  const loadCandidates = async (fetchFn: () => Promise<Candidate[]>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn();
      setCandidates(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load candidates';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    candidates,
    filteredCandidates,
    loading,
    error,
    filters,
    stats,
    interviews,
    updateSearch,
    updateStatusFilter,
    updateInterviewFilter,
    loadCandidates,
    setCandidates,
  };
}
