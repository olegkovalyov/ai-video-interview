import { Card, CardContent } from '@/components/ui/card';
import { InterviewStats } from '../types/interview.types';

interface InterviewStatsCardsProps {
  stats: InterviewStats;
}

export function InterviewStatsCards({ stats }: InterviewStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-yellow-400 mb-2">{stats.total}</div>
          <div className="text-sm text-white/80">Total Interviews</div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-green-400 mb-2">{stats.active}</div>
          <div className="text-sm text-white/80">Active</div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-blue-400 mb-2">{stats.totalCandidates}</div>
          <div className="text-sm text-white/80">Total Candidates</div>
        </CardContent>
      </Card>

      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-6 text-center">
          <div className="text-3xl font-bold text-purple-400 mb-2">{stats.totalResponses}</div>
          <div className="text-sm text-white/80">Completed</div>
        </CardContent>
      </Card>
    </div>
  );
}
