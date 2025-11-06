import { FileText, CheckCircle, FileEdit, Archive } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { TemplateStats } from '../types/template.types';

interface TemplateStatsCardsProps {
  stats: TemplateStats;
  loading?: boolean;
}

export function TemplateStatsCards({ stats, loading = false }: TemplateStatsCardsProps) {
  const cards = [
    {
      label: 'Total Templates',
      value: stats.total,
      icon: FileText,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Active',
      value: stats.active,
      icon: CheckCircle,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Draft',
      value: stats.draft,
      icon: FileEdit,
      color: 'from-yellow-500 to-orange-500',
    },
    {
      label: 'Archived',
      value: stats.archived,
      icon: Archive,
      color: 'from-gray-500 to-slate-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card
            key={card.label}
            className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300"
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">{card.label}</p>
                  <p className="text-3xl font-bold text-white">
                    {loading ? '...' : card.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-gradient-to-br ${card.color}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
