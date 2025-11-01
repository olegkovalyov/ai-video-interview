import { useState, useEffect, useMemo } from 'react';
import { Interview, InterviewFilters, InterviewStats, InterviewStatus } from '../types/interview.types';

export function useInterviews(initialInterviews: Interview[] = []) {
  const [interviews, setInterviews] = useState<Interview[]>(initialInterviews);
  const [filteredInterviews, setFilteredInterviews] = useState<Interview[]>(initialInterviews);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<InterviewFilters>({
    search: '',
    status: 'all',
  });

  // Apply filters
  useEffect(() => {
    let filtered = interviews;

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (interview) =>
          interview.title.toLowerCase().includes(searchLower) ||
          interview.description.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter((interview) => interview.status === filters.status);
    }

    setFilteredInterviews(filtered);
  }, [filters, interviews]);

  // Calculate stats
  const stats: InterviewStats = useMemo(() => {
    const total = interviews.length;
    const active = interviews.filter((i) => i.status === 'active').length;
    const draft = interviews.filter((i) => i.status === 'draft').length;
    const completed = interviews.filter((i) => i.status === 'completed' || i.status === 'closed').length;
    const totalCandidates = interviews.reduce((sum, i) => sum + (i.candidatesCount || i.candidates || 0), 0);
    const totalResponses = interviews.reduce((sum, i) => sum + (i.responsesCount || i.responses || 0), 0);

    return { total, active, draft, completed, totalCandidates, totalResponses };
  }, [interviews]);

  const updateSearch = (search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  };

  const updateStatusFilter = (status: InterviewStatus | 'all') => {
    setFilters((prev) => ({ ...prev, status }));
  };

  const loadInterviews = async (fetchFn: () => Promise<Interview[]>) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchFn();
      setInterviews(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'Failed to load interviews';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    interviews,
    filteredInterviews,
    loading,
    error,
    filters,
    stats,
    updateSearch,
    updateStatusFilter,
    loadInterviews,
    setInterviews,
  };
}
