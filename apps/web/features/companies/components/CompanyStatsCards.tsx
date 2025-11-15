import { Building2, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { CompanyStats } from '../types/company.types';

interface CompanyStatsCardsProps {
  stats: CompanyStats;
}

export function CompanyStatsCards({ stats }: CompanyStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Total Companies */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Total Companies</p>
              <p className="text-3xl font-bold text-white mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Active Companies */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Active</p>
              <p className="text-3xl font-bold text-green-400 mt-2">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inactive Companies */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Inactive</p>
              <p className="text-3xl font-bold text-red-400 mt-2">{stats.inactive}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
              <XCircle className="w-6 h-6 text-red-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Industries */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/70 text-sm font-medium">Industries</p>
              <p className="text-3xl font-bold text-purple-400 mt-2">{stats.totalIndustries}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
