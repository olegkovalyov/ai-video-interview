import { useQuery } from '@tanstack/react-query';
import { candidateSearchKeys } from '../query-keys';
import { searchCandidates, type CandidateSearchFilters } from '@/lib/api/candidate-search';

export function useCandidateSearch(filters: CandidateSearchFilters, enabled = true) {
  return useQuery({
    queryKey: candidateSearchKeys.search(filters),
    queryFn: () => searchCandidates(filters),
    enabled: enabled && (filters.skillIds?.length ?? 0) > 0,
  });
}
