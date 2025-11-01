import { Card, CardContent } from '@/components/ui/card';
import { UserStats } from '../types/user.types';

interface UserStatsCardsProps {
  stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="text-white/70 text-sm">Total Users</div>
          <div className="text-2xl font-bold text-white mt-1">{stats.total}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="text-white/70 text-sm">Active</div>
          <div className="text-2xl font-bold text-green-300 mt-1">{stats.active}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="text-white/70 text-sm">Suspended</div>
          <div className="text-2xl font-bold text-red-300 mt-1">{stats.suspended}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="text-white/70 text-sm">Admins</div>
          <div className="text-2xl font-bold text-purple-300 mt-1">{stats.admins}</div>
        </CardContent>
      </Card>
      
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardContent className="p-4">
          <div className="text-white/70 text-sm">HR Managers</div>
          <div className="text-2xl font-bold text-blue-300 mt-1">{stats.hrs}</div>
        </CardContent>
      </Card>
    </div>
  );
}
