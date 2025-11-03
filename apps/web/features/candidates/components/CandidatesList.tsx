'use client';

import { CandidateStatsCards } from './CandidateStatsCards';
import { CandidateFilters } from './CandidateFilters';
import { CandidateCard } from './CandidateCard';
import { useCandidates } from '../hooks/use-candidates';
import { MOCK_CANDIDATES } from '../services/candidates-mock';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function CandidatesList() {
  const {
    filteredCandidates,
    filters,
    stats,
    interviews,
    updateSearch,
    updateStatusFilter,
    updateInterviewFilter,
  } = useCandidates(MOCK_CANDIDATES);

  return (
    <>
      <CandidateStatsCards stats={stats} />

      <CandidateFilters
        filters={filters}
        interviews={interviews}
        onSearchChange={updateSearch}
        onStatusChange={updateStatusFilter}
        onInterviewChange={updateInterviewFilter}
      />

      {/* Candidates Grid */}
      {filteredCandidates.length === 0 ? (
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6">👥</div>
            <h3 className="text-2xl font-semibold text-white mb-4">No candidates found</h3>
            <p className="text-white/80">Try adjusting your filters or search criteria</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCandidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>

          {/* Pagination */}
          <Card className="bg-white/10 backdrop-blur-md border-white/20 mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-white/70">
                  Showing 1 to {filteredCandidates.length} of {stats.total} candidates
                </div>
                <div className="flex space-x-2">
                  <Button variant="glass" size="sm" disabled>
                    Previous
                  </Button>
                  <Button variant="brand" size="sm" disabled={filteredCandidates.length === stats.total}>
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
