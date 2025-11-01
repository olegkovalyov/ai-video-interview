import Link from 'next/link';
import { Mail, Phone, MapPin, Star, MoreVertical } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Candidate } from '../types/candidate.types';
import { getStatusColor, getScoreColor, getInitials, formatDate } from '../utils/candidate-helpers';

interface CandidateCardProps {
  candidate: Candidate;
}

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold cursor-pointer">
              {getInitials(candidate.name)}
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white cursor-pointer hover:text-yellow-400 transition-colors">
                {candidate.name}
              </h3>
              <p className="text-white/70 text-sm">{candidate.position}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusColor(candidate.status)}`}>
                  {candidate.status.replace('_', ' ')}
                </span>
                {candidate.score !== null && (
                  <div className={`flex items-center space-x-1 ${getScoreColor(candidate.score)}`}>
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-semibold">{candidate.score}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <button className="text-white/60 hover:text-white p-1 cursor-pointer">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-white/70">
            <Mail className="w-4 h-4" />
            <span className="text-sm">{candidate.email}</span>
          </div>
          {candidate.phone && (
            <div className="flex items-center space-x-2 text-white/70">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{candidate.phone}</span>
            </div>
          )}
          {candidate.location && (
            <div className="flex items-center space-x-2 text-white/70">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{candidate.location}</span>
            </div>
          )}
        </div>

        <div className="bg-white/5 rounded-lg p-3 mb-4">
          <p className="text-white/70 text-sm mb-1">Interview: {candidate.interview}</p>
          <div className="flex justify-between text-xs text-white/60">
            <span>Applied: {formatDate(candidate.appliedAt)}</span>
            {candidate.completedAt && <span>Completed: {formatDate(candidate.completedAt)}</span>}
          </div>
        </div>

        <div className="flex space-x-2">
          <Button asChild variant="brand" size="sm" className="flex-1">
            <Link href={`/candidates/${candidate.id}`}>View Profile</Link>
          </Button>
          {candidate.status === 'completed' && (
            <Button asChild variant="glass" size="sm">
              <Link href={`/candidates/${candidate.id}/results`}>Results</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
