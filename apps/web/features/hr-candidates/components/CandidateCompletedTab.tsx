'use client';

import { useState } from 'react';
import { CheckCircle, Star, Clock, Eye, Download, MoreVertical, Trophy } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Mock data - will be replaced with real API
const mockCompletedInterviews = [
  {
    id: '1',
    candidate: {
      id: 'c1',
      name: 'Emily Chen',
      email: 'emily.chen@example.com',
    },
    template: {
      id: 't1',
      title: 'Frontend Developer Interview',
      questionsCount: 5,
    },
    company: {
      id: 'comp1',
      name: 'TechCorp Inc.',
    },
    score: 92,
    duration: 38, // minutes
    completedAt: '2024-12-03T16:45:00Z',
    reviewed: true,
  },
  {
    id: '2',
    candidate: {
      id: 'c2',
      name: 'David Park',
      email: 'david.p@example.com',
    },
    template: {
      id: 't2',
      title: 'Backend Engineer Interview',
      questionsCount: 8,
    },
    company: {
      id: 'comp1',
      name: 'TechCorp Inc.',
    },
    score: 85,
    duration: 52,
    completedAt: '2024-12-03T14:20:00Z',
    reviewed: true,
  },
  {
    id: '3',
    candidate: {
      id: 'c3',
      name: 'Lisa Wang',
      email: 'lisa.w@example.com',
    },
    template: {
      id: 't1',
      title: 'Frontend Developer Interview',
      questionsCount: 5,
    },
    company: {
      id: 'comp2',
      name: 'StartupXYZ',
    },
    score: 78,
    duration: 41,
    completedAt: '2024-12-02T11:30:00Z',
    reviewed: false,
  },
  {
    id: '4',
    candidate: {
      id: 'c4',
      name: 'James Wilson',
      email: 'james.w@example.com',
    },
    template: {
      id: 't3',
      title: 'Full Stack Developer Interview',
      questionsCount: 10,
    },
    company: {
      id: 'comp1',
      name: 'TechCorp Inc.',
    },
    score: 88,
    duration: 65,
    completedAt: '2024-12-02T09:15:00Z',
    reviewed: true,
  },
  {
    id: '5',
    candidate: {
      id: 'c5',
      name: 'Anna Martinez',
      email: 'anna.m@example.com',
    },
    template: {
      id: 't2',
      title: 'Backend Engineer Interview',
      questionsCount: 8,
    },
    company: {
      id: 'comp2',
      name: 'StartupXYZ',
    },
    score: 71,
    duration: 48,
    completedAt: '2024-12-01T15:00:00Z',
    reviewed: false,
  },
  {
    id: '6',
    candidate: {
      id: 'c6',
      name: 'Robert Lee',
      email: 'robert.l@example.com',
    },
    template: {
      id: 't1',
      title: 'Frontend Developer Interview',
      questionsCount: 5,
    },
    company: {
      id: 'comp1',
      name: 'TechCorp Inc.',
    },
    score: 95,
    duration: 35,
    completedAt: '2024-12-01T10:30:00Z',
    reviewed: true,
  },
];

function getScoreColor(score: number) {
  if (score >= 90) return 'text-green-400';
  if (score >= 75) return 'text-yellow-400';
  if (score >= 60) return 'text-orange-400';
  return 'text-red-400';
}

function getScoreBadge(score: number) {
  if (score >= 90) return { label: 'Excellent', bg: 'bg-green-500/20', text: 'text-green-300' };
  if (score >= 75) return { label: 'Good', bg: 'bg-yellow-500/20', text: 'text-yellow-300' };
  if (score >= 60) return { label: 'Average', bg: 'bg-orange-500/20', text: 'text-orange-300' };
  return { label: 'Below Average', bg: 'bg-red-500/20', text: 'text-red-300' };
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function CandidateCompletedTab() {
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  const sortedInterviews = [...mockCompletedInterviews].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    }
    return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
  });

  const needsReviewCount = mockCompletedInterviews.filter(i => !i.reviewed).length;
  const avgScore = Math.round(mockCompletedInterviews.reduce((sum, i) => sum + i.score, 0) / mockCompletedInterviews.length);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Completed</p>
              <p className="text-2xl font-bold text-white">{mockCompletedInterviews.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Average Score</p>
              <p className="text-2xl font-bold text-white">{avgScore}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/10 backdrop-blur-md border-white/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Eye className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-white/60 text-sm">Needs Review</p>
              <p className="text-2xl font-bold text-white">{needsReviewCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sort */}
      <div className="flex items-center justify-between">
        <p className="text-white/70 text-sm">
          Showing {sortedInterviews.length} completed interview{sortedInterviews.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-white/60 text-sm">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
            className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 cursor-pointer"
          >
            <option value="date" className="bg-gray-800">Date</option>
            <option value="score" className="bg-gray-800">Score</option>
          </select>
        </div>
      </div>

      {/* Interviews List */}
      <div className="space-y-4">
        {sortedInterviews.map(interview => {
          const scoreBadge = getScoreBadge(interview.score);
          
          return (
            <Card key={interview.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {interview.candidate.name.split(' ').map(n => n[0]).join('')}
                    </div>

                    {/* Info */}
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-bold text-white">{interview.candidate.name}</h3>
                        <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${scoreBadge.bg} ${scoreBadge.text}`}>
                          <Star className="w-3 h-3" />
                          {scoreBadge.label}
                        </span>
                        {!interview.reviewed && (
                          <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                            New
                          </span>
                        )}
                      </div>
                      <p className="text-white/60 text-sm mb-3">{interview.candidate.email}</p>
                      
                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="text-white/50">Template:</span>
                          <span className="text-white">{interview.template.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/70">
                          <span className="text-white/50">Company:</span>
                          <span className="text-white">{interview.company.name}</span>
                        </div>
                      </div>

                      {/* Score & Duration */}
                      <div className="flex items-center gap-6 mt-3">
                        <div className="flex items-center gap-2">
                          <span className="text-white/50 text-sm">Score:</span>
                          <span className={`text-2xl font-bold ${getScoreColor(interview.score)}`}>
                            {interview.score}%
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-white/60 text-sm">
                          <Clock className="w-4 h-4" />
                          {interview.duration} min
                        </div>
                        <div className="text-white/50 text-sm">
                          {formatDate(interview.completedAt)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-semibold cursor-pointer"
                      onClick={() => toast.info('View results - coming soon')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Results
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20 cursor-pointer"
                      onClick={() => toast.info('Download report - coming soon')}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
                      onClick={() => toast.info('More options - coming soon')}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
