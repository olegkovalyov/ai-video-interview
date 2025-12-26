'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Star, Clock, Eye, Download, MoreVertical, Trophy, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { listHRInvitations, InvitationListItem } from '@/lib/api/invitations';

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

function generateRandomScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return 60 + Math.abs(hash % 40);
}

export function CandidateCompletedTab() {
  const [invitations, setInvitations] = useState<InvitationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  useEffect(() => {
    loadCompletedInvitations();
  }, []);

  const loadCompletedInvitations = async () => {
    try {
      setLoading(true);
      const response = await listHRInvitations({ status: 'completed', limit: 100 });
      setInvitations(response.items || []);
    } catch (error) {
      console.error('Failed to load completed invitations:', error);
      toast.error('Failed to load completed interviews');
    } finally {
      setLoading(false);
    }
  };

  const invitationsWithScores = invitations.map(inv => ({
    ...inv,
    score: generateRandomScore(inv.id),
  }));

  const sortedInterviews = [...invitationsWithScores].sort((a, b) => {
    if (sortBy === 'score') {
      return b.score - a.score;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const avgScore = invitationsWithScores.length > 0 
    ? Math.round(invitationsWithScores.reduce((sum, i) => sum + i.score, 0) / invitationsWithScores.length)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    );
  }

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
              <p className="text-2xl font-bold text-white">{invitations.length}</p>
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
              <p className="text-2xl font-bold text-white">{avgScore > 0 ? `${avgScore}%` : '-'}</p>
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
              <p className="text-2xl font-bold text-white">{invitations.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No completed interviews yet</h3>
          <p className="text-white/60">
            Completed interviews will appear here for review
          </p>
        </div>
      ) : (
        <>
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
              const candidateName = interview.candidateName || interview.candidateEmail?.split('@')[0] || 'Unknown';
              const initials = candidateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
              
              return (
                <Card key={interview.id} className="bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/15 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {initials}
                        </div>

                        {/* Info */}
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-lg font-bold text-white">{candidateName}</h3>
                            <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${scoreBadge.bg} ${scoreBadge.text}`}>
                              <Star className="w-3 h-3" />
                              {scoreBadge.label}
                            </span>
                            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">
                              New
                            </span>
                          </div>
                          <p className="text-white/60 text-sm mb-3">{interview.candidateEmail}</p>
                          
                          <div className="flex flex-wrap gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-white/70">
                              <span className="text-white/50">Template:</span>
                              <span className="text-white">{interview.templateTitle}</span>
                            </div>
                            {interview.companyName && (
                              <div className="flex items-center gap-1.5 text-white/70">
                                <span className="text-white/50">Company:</span>
                                <span className="text-white">{interview.companyName}</span>
                              </div>
                            )}
                          </div>

                          {/* Score & Duration */}
                          <div className="flex items-center gap-6 mt-3">
                            <div className="flex items-center gap-2">
                              <span className="text-white/50 text-sm">Score:</span>
                              <span className={`text-2xl font-bold ${getScoreColor(interview.score)}`}>
                                {interview.score}%
                              </span>
                            </div>
                            {interview.progress && (
                              <div className="flex items-center gap-1.5 text-white/60 text-sm">
                                <Clock className="w-4 h-4" />
                                {interview.progress.answered}/{interview.progress.total} questions
                              </div>
                            )}
                            <div className="text-white/50 text-sm">
                              {formatDate(interview.createdAt)}
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
        </>
      )}
    </div>
  );
}
