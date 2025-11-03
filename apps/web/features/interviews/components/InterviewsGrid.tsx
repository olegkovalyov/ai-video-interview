'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InterviewStatsCards } from './InterviewStatsCards';
import { InterviewFilters } from './InterviewFilters';
import { InterviewCard } from './InterviewCard';
import { useInterviews } from '../hooks/use-interviews';
import { MOCK_INTERVIEWS } from '../services/interviews-mock';

export function InterviewsGrid() {
  const { filteredInterviews, filters, stats, updateSearch, updateStatusFilter } = useInterviews(MOCK_INTERVIEWS);

  return (
    <>
      <InterviewStatsCards stats={stats} />

      <InterviewFilters filters={filters} onSearchChange={updateSearch} onStatusChange={updateStatusFilter} />

      {filteredInterviews.length === 0 ? (
        /* Empty State */
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-12 text-center">
            <div className="text-6xl mb-6">🎯</div>
            <h3 className="text-2xl font-semibold text-white mb-4">No interviews yet</h3>
            <p className="text-white/80 mb-8 max-w-md mx-auto">
              Get started by creating your first AI-powered video interview template.
            </p>
            <Button asChild variant="brand" size="lg">
              <Link href="/interviews/create" className="flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Create Your First Interview</span>
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Interviews Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInterviews.map((interview) => (
            <InterviewCard key={interview.id} interview={interview} />
          ))}
        </div>
      )}
    </>
  );
}
