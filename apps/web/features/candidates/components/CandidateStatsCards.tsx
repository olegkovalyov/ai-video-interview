import { Card, CardContent } from '@/components/ui/card';
import { CandidateStats } from '../types/candidate.types';

interface CandidateStatsCardsProps {
  stats: CandidateStats;
}

export function CandidateStatsCards({ stats }: CandidateStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-white mb-2">{stats.total}</div>
          <div className="text-sm text-white/80">Total Candidates</div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">{stats.completed}</div>
          <div className="text-sm text-white/80">Completed</div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.inProgress}</div>
          <div className="text-sm text-white/80">In Progress</div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.pending}</div>
          <div className="text-sm text-white/80">Pending</div>
        </CardContent>
      </Card>
    </div>
  );
}
