'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InterviewListItem } from './InterviewListItem';
import { useInterviews } from '../hooks/use-interviews';
import { MOCK_INTERVIEWS } from '../services/interviews-mock';

export function InterviewsList() {
  const { filteredInterviews, loading, error } = useInterviews(MOCK_INTERVIEWS);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-lg">Loading interviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-lg mb-8">
        {error}
      </div>
    );
  }

  if (filteredInterviews.length === 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-16 text-center">
          <div className="text-7xl mb-6 opacity-60">📋</div>
          <h2 className="text-2xl font-semibold text-white mb-4">No interviews yet</h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto">
            Create your first interview to start evaluating candidates with AI-powered analysis
          </p>
          <Button asChild variant="brand" size="lg">
            <Link href="/dashboard/interviews/create">Create Your First Interview</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {filteredInterviews.map((interview) => (
        <InterviewListItem key={interview.id} interview={interview} />
      ))}
    </div>
  );
}
