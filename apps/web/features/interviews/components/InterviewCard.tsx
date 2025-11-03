import Link from 'next/link';
import { Users, Play, Calendar, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Interview } from '../types/interview.types';
import { formatDate, getStatusColor } from '../utils/interview-helpers';

interface InterviewCardProps {
  interview: Interview;
}

export function InterviewCard({ interview }: InterviewCardProps) {
  const candidatesCount = interview.candidatesCount ?? interview.candidates ?? 0;
  const responsesCount = interview.responsesCount ?? interview.responses ?? 0;

  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold text-white">{interview.title}</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(interview.status)}`}>
                {interview.status}
              </span>
            </div>
            <p className="text-white/70 text-sm mb-4">{interview.description}</p>
          </div>
          <button className="text-white/60 hover:text-white p-1 cursor-pointer">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4 flex-grow">
          <div className="flex items-center space-x-2 text-white/70">
            <Users className="w-4 h-4" />
            <span className="text-sm">{candidatesCount} candidates</span>
          </div>
          <div className="flex items-center space-x-2 text-white/70">
            <Play className="w-4 h-4" />
            <span className="text-sm">{responsesCount} responses</span>
          </div>
          {interview.duration && (
            <div className="flex items-center space-x-2 text-white/70">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">{interview.duration} min</span>
            </div>
          )}
          <div className="text-white/70 text-sm">Created {formatDate(interview.createdAt)}</div>
        </div>

        <div className="flex space-x-2 mt-auto">
          <Button asChild variant="brand" size="sm" className="flex-1">
            <Link href={`/interviews/${interview.id}`} className="cursor-pointer">
              View Details
            </Link>
          </Button>
          {interview.status === 'active' && (
            <Button asChild variant="glass" size="sm" className="cursor-pointer">
              <Link href={`/interviews/${interview.id}/candidates`}>
                <Users className="w-4 h-4" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
